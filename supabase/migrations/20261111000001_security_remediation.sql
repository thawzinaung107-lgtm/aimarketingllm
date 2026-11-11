-- =============================================================================
-- Security remediation (P0) — see SECURITY_AUDIT.md
--
-- Fixes, in order:
--   V1 privilege escalation via profiles.role
--   V2 students creating/activating their own enrollments
--   V3 redeem codes readable by any signed-in user (now hashed, admin-only)
--   V4 lesson video URLs publicly readable (moved to admin-only lesson_media)
--   V5 recursive admin RLS policies (replaced with private.is_admin())
--   V6 no profile creation path (auth.users trigger, always 'student')
--   V7 SECURITY-unsafe SQL functions trusting caller-supplied IDs
-- plus: removal of invented business defaults (365-day access).
--
-- Principles:
--   * anon/authenticated get NO table or function privileges by default;
--     every privilege below is an explicit grant.
--   * All state changes that grant access go through SECURITY DEFINER
--     functions that derive identity from auth.uid(), never from arguments.
--   * Every SECURITY DEFINER function sets search_path = ''.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- 0. Lock down default privileges
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Private schema: not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Drop every existing policy and the unsafe functions
-- -----------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname
           from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

drop function if exists public.redeem_code(text, uuid);
drop function if exists public.approve_manual_payment(uuid, uuid, text);
drop function if exists public.log_admin_action(uuid, text, text, uuid, jsonb, jsonb);
drop trigger if exists enforce_device_limit on public.registered_devices;
drop function if exists public.check_device_limit();
drop function if exists public.cleanup_expired_sessions();

-- Harden the remaining original function.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Schema changes
-- -----------------------------------------------------------------------------

-- profiles: email may be absent for some providers.
alter table public.profiles alter column email drop not null;

-- courses: no invented defaults. Price, currency and access duration are set
-- by an admin; a course cannot be published until all three are configured.
alter table public.courses
  alter column access_duration_days drop default,
  alter column access_duration_days drop not null,
  add column currency text;

alter table public.courses
  add constraint courses_price_nonnegative
    check (price is null or price >= 0),
  add constraint courses_duration_positive
    check (access_duration_days is null or access_duration_days > 0),
  add constraint courses_currency_iso
    check (currency is null or currency ~ '^[A-Z]{3}$'),
  add constraint courses_price_currency_pair
    check ((price is null) = (currency is null)),
  add constraint courses_publish_requires_terms
    check (not is_published
           or (price is not null and currency is not null
               and access_duration_days is not null));

-- enrollments: an active enrollment is always time-limited and has a source.
alter table public.enrollments
  add column source text
    check (source in ('manual_payment', 'redeem_code', 'admin'));

alter table public.enrollments
  add constraint enrollments_active_is_time_limited
    check (status <> 'active' or (enrolled_at is not null and expires_at is not null));

-- lesson video sources move out of the publicly readable lessons table.
create table public.lesson_media (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  storage_path text not null check (length(storage_path) between 1 and 1024),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.lesson_media (lesson_id, storage_path)
select id, video_url from public.lessons where video_url is not null;

alter table public.lessons drop column video_url;

create trigger update_lesson_media_updated_at before update on public.lesson_media
  for each row execute function public.update_updated_at_column();

-- lesson_progress: position cannot be negative.
alter table public.lesson_progress
  add constraint lesson_progress_position_nonnegative check (watched_seconds >= 0);

-- manual_payments: snapshot what the student was asked to pay, add a
-- reference, allow only one pending submission per user and course.
alter table public.manual_payments
  add column currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  add column expected_amount numeric(10,2),
  add column payment_reference text check (length(payment_reference) <= 200),
  add constraint manual_payments_amount_nonnegative check (amount >= 0);

create unique index manual_payments_one_pending_per_course
  on public.manual_payments (user_id, course_id) where status = 'pending';

-- redeem_codes: store only a SHA-256 hash plus a short hint for admins.
alter table public.redeem_codes add column code_hash text, add column code_hint text;
update public.redeem_codes
  set code_hash = encode(extensions.digest(upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex'),
      code_hint = right(upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')), 4);
alter table public.redeem_codes
  drop column code,
  alter column code_hash set not null,
  add constraint redeem_codes_code_hash_key unique (code_hash),
  add constraint redeem_codes_max_uses_positive check (max_uses >= 1),
  alter column created_by drop not null;
alter table public.redeem_codes drop constraint redeem_codes_created_by_fkey;
alter table public.redeem_codes add constraint redeem_codes_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;
drop index if exists public.idx_redeem_codes_code;

-- registered_devices: store a hash of a server-issued device key, not a
-- client-supplied fingerprint.
alter table public.registered_devices rename column device_fingerprint to device_key_hash;
drop index if exists public.idx_registered_devices_fingerprint;

-- user_sessions: bind Supabase auth sessions to registered devices.
-- Never store raw tokens.
drop table public.user_sessions;
create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null references public.registered_devices(id) on delete cascade,
  auth_session_id uuid not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index idx_user_sessions_user_id on public.user_sessions(user_id);
create index idx_user_sessions_device_id on public.user_sessions(device_id);

-- device_events: append-only history, used for audit and throttling.
create table public.device_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid,
  event text not null check (event in ('registered', 'removed_by_user', 'removed_by_admin', 'limit_rejected')),
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_device_events_user_created on public.device_events(user_id, created_at desc);

-- admin_audit_logs: survive admin deletion; append-only.
alter table public.admin_audit_logs alter column admin_id drop not null;
alter table public.admin_audit_logs drop constraint admin_audit_logs_admin_id_fkey;
alter table public.admin_audit_logs add constraint admin_audit_logs_admin_id_fkey
  foreign key (admin_id) references public.profiles(id) on delete set null;

-- RLS on new tables.
alter table public.lesson_media enable row level security;
alter table public.user_sessions enable row level security;
alter table public.device_events enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Private helpers (not exposed through the API)
-- -----------------------------------------------------------------------------

-- V5: SECURITY DEFINER, owned by postgres (table owner), so reading profiles
-- here bypasses RLS and cannot recurse into profiles policies.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

create or replace function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function private.normalize_redeem_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create or replace function private.hash_secret(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(p_value, 'sha256'), 'hex');
$$;

create or replace function private.log_admin_action(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_old jsonb default null, p_new jsonb default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old, p_new);
end;
$$;

create or replace function private.has_active_enrollment(p_user_id uuid, p_course_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id from public.enrollments e
  where e.user_id = p_user_id and e.course_id = p_course_id
    and e.status = 'active' and e.expires_at > now();
$$;

-- True when the caller's current auth session is bound to one of their
-- registered devices.
create or replace function private.current_session_on_registered_device(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_sessions s
    where s.user_id = p_user_id
      and s.auth_session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

-- Grants (or extends) an enrollment. Never shortens an existing active one.
create or replace function private.grant_enrollment(
  p_user_id uuid, p_course_id uuid, p_expires_at timestamptz, p_source text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  insert into public.enrollments as e (user_id, course_id, status, enrolled_at, expires_at, source)
  values (p_user_id, p_course_id, 'active', now(), p_expires_at, p_source)
  on conflict (user_id, course_id) do update set
    status      = 'active',
    enrolled_at = case when e.status = 'active' and e.expires_at > now()
                       then e.enrolled_at else now() end,
    expires_at  = case when e.status = 'active' and e.expires_at > now()
                       then greatest(e.expires_at, excluded.expires_at)
                       else excluded.expires_at end,
    source      = excluded.source
  returning e.id into v_id;
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Triggers: profile creation (V6), role guard (V1), audit, device limit
-- -----------------------------------------------------------------------------

-- V6: every new auth user gets a profile, always with role 'student'.
-- User-controlled metadata is only used for the display name.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name',
                         new.raw_user_meta_data ->> 'name', ''), 200), ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create or replace function private.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_auth_user_email_change();

-- Backfill any auth users that predate the trigger.
insert into public.profiles (id, email, role)
select u.id, u.email, 'student' from auth.users u
on conflict (id) do nothing;

-- V1 defence in depth: SECURITY INVOKER so current_user is the API role.
-- Column privileges already block this; the trigger catches any future grant
-- mistake.
create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.role is distinct from old.role then
      raise exception 'Changing role is not allowed' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'Changing identity fields is not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function private.guard_profile_columns();

-- Device limit, enforced for every insert path. The advisory lock serialises
-- concurrent registrations for the same user so two parallel inserts cannot
-- both observe count = 1.
create or replace function private.enforce_device_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('device_limit:' || new.user_id::text, 0));
  if (select count(*) from public.registered_devices where user_id = new.user_id) >= 2 then
    raise exception 'Device limit reached. Remove a device before adding a new one.'
      using errcode = 'LMS01';
  end if;
  return new;
end;
$$;

create trigger enforce_device_limit
  before insert on public.registered_devices
  for each row execute function private.enforce_device_limit();

-- A device row may never be moved to another user or re-keyed.
create or replace function private.guard_device_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.device_key_hash is distinct from old.device_key_hash then
    raise exception 'Device identity cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_device_columns
  before update on public.registered_devices
  for each row execute function private.guard_device_columns();

-- Audit trail for admin content edits made through RLS-guarded table writes.
create or replace function private.audit_admin_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    return coalesce(new, old);  -- service-role/maintenance writes
  end if;
  v_id := case when tg_op = 'DELETE' then (to_jsonb(old) ->> case when tg_table_name = 'lesson_media' then 'lesson_id' else 'id' end)::uuid
               else (to_jsonb(new) ->> case when tg_table_name = 'lesson_media' then 'lesson_id' else 'id' end)::uuid end;
  perform private.log_admin_action(
    lower(tg_op), tg_table_name, v_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;

create trigger audit_courses after insert or update or delete on public.courses
  for each row execute function private.audit_admin_content_change();
create trigger audit_course_modules after insert or update or delete on public.course_modules
  for each row execute function private.audit_admin_content_change();
create trigger audit_lessons after insert or update or delete on public.lessons
  for each row execute function private.audit_admin_content_change();
create trigger audit_lesson_media after insert or update or delete on public.lesson_media
  for each row execute function private.audit_admin_content_change();
create trigger audit_homepage_banners after insert or update or delete on public.homepage_banners
  for each row execute function private.audit_admin_content_change();

-- -----------------------------------------------------------------------------
-- 5. RLS policies (V1, V2, V3, V4, V5)
-- -----------------------------------------------------------------------------

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_admin on public.profiles
  for select to authenticated using ((select private.is_admin()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- courses
create policy courses_select_published on public.courses
  for select to anon, authenticated using (is_published);
create policy courses_admin_all on public.courses
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- course_modules
create policy course_modules_select_published on public.course_modules
  for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.is_published));
create policy course_modules_admin_all on public.course_modules
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- lessons (metadata only — no video source in this table any more)
create policy lessons_select_published on public.lessons
  for select to anon, authenticated
  using (is_published and exists (select 1 from public.courses c where c.id = course_id and c.is_published));
create policy lessons_admin_all on public.lessons
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- lesson_media: admins only. Students obtain playback via get_lesson_playback().
create policy lesson_media_admin_all on public.lesson_media
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- enrollments: read-only from the API. All writes go through functions.
create policy enrollments_select_own on public.enrollments
  for select to authenticated using (user_id = (select auth.uid()));
create policy enrollments_select_admin on public.enrollments
  for select to authenticated using ((select private.is_admin()));

-- lesson_progress
create policy lesson_progress_select_own on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy lesson_progress_select_admin on public.lesson_progress
  for select to authenticated using ((select private.is_admin()));

-- manual_payments
create policy manual_payments_select_own on public.manual_payments
  for select to authenticated using (user_id = (select auth.uid()));
create policy manual_payments_select_admin on public.manual_payments
  for select to authenticated using ((select private.is_admin()));

-- redeem_codes: admins only (and the hash column is not granted at all).
create policy redeem_codes_select_admin on public.redeem_codes
  for select to authenticated using ((select private.is_admin()));
create policy redeem_codes_update_admin on public.redeem_codes
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- redeem_code_usages
create policy redeem_code_usages_select_own on public.redeem_code_usages
  for select to authenticated using (user_id = (select auth.uid()));
create policy redeem_code_usages_select_admin on public.redeem_code_usages
  for select to authenticated using ((select private.is_admin()));

-- registered_devices / user_sessions / device_events: read own, admins read all.
create policy registered_devices_select_own on public.registered_devices
  for select to authenticated using (user_id = (select auth.uid()));
create policy registered_devices_select_admin on public.registered_devices
  for select to authenticated using ((select private.is_admin()));
create policy user_sessions_select_own on public.user_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_sessions_select_admin on public.user_sessions
  for select to authenticated using ((select private.is_admin()));
create policy device_events_select_own on public.device_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy device_events_select_admin on public.device_events
  for select to authenticated using ((select private.is_admin()));

-- homepage_banners
create policy homepage_banners_select_active on public.homepage_banners
  for select to anon, authenticated using (is_active);
create policy homepage_banners_admin_all on public.homepage_banners
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- admin_audit_logs: admins read; nobody writes directly (append-only via
-- SECURITY DEFINER helpers and triggers).
create policy admin_audit_logs_select_admin on public.admin_audit_logs
  for select to authenticated using ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- 6. Table privileges (explicit, least privilege)
-- -----------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select on public.courses, public.course_modules, public.lessons, public.homepage_banners
  to anon, authenticated;
grant insert, update, delete on public.courses, public.course_modules, public.lessons, public.homepage_banners
  to authenticated;  -- RLS limits these to admins

grant select, insert, update, delete on public.lesson_media to authenticated;  -- RLS: admins only

grant select on public.enrollments, public.lesson_progress, public.manual_payments,
  public.redeem_code_usages, public.user_sessions, public.device_events, public.admin_audit_logs
  to authenticated;

grant select (id, user_id, device_name, user_agent, ip_address, last_used_at, created_at)
  on public.registered_devices to authenticated;

grant select (id, code_hint, course_id, max_uses, current_uses, expires_at, is_active,
              created_by, created_at, updated_at)
  on public.redeem_codes to authenticated;
grant update (is_active) on public.redeem_codes to authenticated;  -- RLS: admins only

-- -----------------------------------------------------------------------------
-- 7. API functions (V2, V3, V4, V7). Identity always comes from auth.uid().
-- -----------------------------------------------------------------------------

-- V3: redeem a code for the CALLER only.
create or replace function public.redeem_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_code public.redeem_codes%rowtype;
  v_course public.courses%rowtype;
  v_enrollment_id uuid;
begin
  select * into v_code from public.redeem_codes
  where code_hash = private.hash_secret(private.normalize_redeem_code(p_code))
  for update;

  if not found or not v_code.is_active
     or (v_code.expires_at is not null and v_code.expires_at <= now())
     or v_code.current_uses >= v_code.max_uses then
    raise exception 'This code is invalid or no longer available' using errcode = 'LMS02';
  end if;

  if exists (select 1 from public.redeem_code_usages u
             where u.redeem_code_id = v_code.id and u.user_id = v_uid) then
    raise exception 'You have already redeemed this code' using errcode = 'LMS03';
  end if;

  select * into v_course from public.courses where id = v_code.course_id;
  if not v_course.is_published or v_course.access_duration_days is null then
    raise exception 'This course is not currently available' using errcode = 'LMS04';
  end if;

  v_enrollment_id := private.grant_enrollment(
    v_uid, v_course.id, now() + make_interval(days => v_course.access_duration_days), 'redeem_code');

  insert into public.redeem_code_usages (redeem_code_id, user_id, enrollment_id)
  values (v_code.id, v_uid, v_enrollment_id);

  update public.redeem_codes set current_uses = current_uses + 1 where id = v_code.id;

  return v_enrollment_id;
end;
$$;

-- V2: students submit a payment record; it grants nothing until approved.
create or replace function public.submit_manual_payment(
  p_course_id uuid,
  p_amount numeric,
  p_payment_reference text default null,
  p_proof_path text default null,
  p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_course public.courses%rowtype;
  v_id uuid;
begin
  select * into v_course from public.courses where id = p_course_id;
  if not found or not v_course.is_published
     or v_course.price is null or v_course.access_duration_days is null then
    raise exception 'This course is not available for purchase' using errcode = 'LMS04';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'Invalid amount' using errcode = '22023';
  end if;
  if p_proof_path is not null and p_proof_path not like v_uid::text || '/%' then
    raise exception 'Invalid proof file' using errcode = '42501';
  end if;
  if private.has_active_enrollment(v_uid, p_course_id) is not null then
    raise exception 'You already have active access to this course' using errcode = 'LMS05';
  end if;

  insert into public.manual_payments
    (user_id, course_id, amount, currency, expected_amount, payment_reference,
     payment_proof_url, payment_notes, status)
  values
    (v_uid, p_course_id, p_amount, v_course.currency, v_course.price,
     left(p_payment_reference, 200), p_proof_path, left(p_notes, 2000), 'pending')
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'You already have a pending payment for this course' using errcode = 'LMS06';
end;
$$;

-- V7: approval derives the admin from auth.uid(); admins cannot approve
-- their own payments.
create or replace function public.approve_manual_payment(
  p_payment_id uuid, p_admin_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_payment public.manual_payments%rowtype;
  v_course public.courses%rowtype;
  v_enrollment_id uuid;
begin
  select * into v_payment from public.manual_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_payment.status <> 'pending' then
    raise exception 'Payment has already been reviewed' using errcode = 'LMS07';
  end if;
  if v_payment.user_id = v_admin then
    raise exception 'Admins cannot approve their own payments' using errcode = '42501';
  end if;

  select * into v_course from public.courses where id = v_payment.course_id;
  if v_course.access_duration_days is null then
    raise exception 'Course access duration is not configured' using errcode = 'LMS04';
  end if;

  v_enrollment_id := private.grant_enrollment(
    v_payment.user_id, v_payment.course_id,
    now() + make_interval(days => v_course.access_duration_days), 'manual_payment');

  update public.manual_payments
     set status = 'approved', reviewed_at = now(), reviewed_by = v_admin,
         admin_notes = left(p_admin_notes, 2000), enrollment_id = v_enrollment_id
   where id = p_payment_id;

  perform private.log_admin_action('approve_payment', 'manual_payments', p_payment_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'approved', 'enrollment_id', v_enrollment_id));
  return v_enrollment_id;
end;
$$;

create or replace function public.reject_manual_payment(
  p_payment_id uuid, p_admin_notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_status public.payment_status;
begin
  select status into v_status from public.manual_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_status <> 'pending' then
    raise exception 'Payment has already been reviewed' using errcode = 'LMS07';
  end if;
  update public.manual_payments
     set status = 'rejected', reviewed_at = now(), reviewed_by = v_admin,
         admin_notes = left(p_admin_notes, 2000)
   where id = p_payment_id;
  perform private.log_admin_action('reject_payment', 'manual_payments', p_payment_id,
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'rejected'));
end;
$$;

-- Admin: explicit access grant with an explicit expiry.
create or replace function public.admin_grant_enrollment(
  p_user_id uuid, p_course_id uuid, p_expires_at timestamptz, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_id uuid;
begin
  if p_expires_at is null or p_expires_at <= now() then
    raise exception 'An expiry date in the future is required' using errcode = '22023';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id)
     or not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'User or course not found' using errcode = 'P0002';
  end if;

  insert into public.enrollments as e (user_id, course_id, status, enrolled_at, expires_at, source)
  values (p_user_id, p_course_id, 'active', now(), p_expires_at, 'admin')
  on conflict (user_id, course_id) do update
    set status = 'active', expires_at = excluded.expires_at, source = 'admin',
        enrolled_at = case when e.status = 'active' and e.expires_at > now() then e.enrolled_at else now() end
  returning e.id into v_id;

  perform private.log_admin_action('grant_enrollment', 'enrollments', v_id, null,
    jsonb_build_object('user_id', p_user_id, 'course_id', p_course_id,
                       'expires_at', p_expires_at, 'reason', left(p_reason, 500)));
  return v_id;
end;
$$;

create or replace function public.admin_revoke_enrollment(p_enrollment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_admin uuid := private.require_admin();
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required' using errcode = '22023';
  end if;
  update public.enrollments set status = 'cancelled' where id = p_enrollment_id;
  if not found then
    raise exception 'Enrollment not found' using errcode = 'P0002';
  end if;
  perform private.log_admin_action('revoke_enrollment', 'enrollments', p_enrollment_id, null,
    jsonb_build_object('status', 'cancelled', 'reason', left(p_reason, 500)));
end;
$$;

-- Admin: change a user's role. Admins cannot change their own role.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_old public.user_role;
begin
  if p_user_id = v_admin then
    raise exception 'Admins cannot change their own role' using errcode = '42501';
  end if;
  select role into v_old from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  perform private.log_admin_action('set_role', 'profiles', p_user_id,
    jsonb_build_object('role', v_old), jsonb_build_object('role', p_role));
end;
$$;

-- V3: admins generate codes. Plaintext is returned exactly once; only the
-- hash is stored. 16 characters from a 31-symbol alphabet (~79 bits).
create or replace function public.admin_create_redeem_codes(
  p_course_id uuid, p_count integer, p_max_uses integer default 1,
  p_expires_at timestamptz default null)
returns table (id uuid, code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_raw text;
  v_code text;
  v_bytes bytea;
  v_byte integer;
  v_id uuid;
  i integer;
  j integer;
begin
  if p_count is null or p_count < 1 or p_count > 500 then
    raise exception 'Count must be between 1 and 500' using errcode = '22023';
  end if;
  if p_max_uses is null or p_max_uses < 1 then
    raise exception 'Max uses must be at least 1' using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Expiry must be in the future' using errcode = '22023';
  end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found' using errcode = 'P0002';
  end if;

  for i in 1..p_count loop
    v_raw := '';
    while length(v_raw) < 16 loop
      v_bytes := extensions.gen_random_bytes(32);
      for j in 0..31 loop
        v_byte := get_byte(v_bytes, j);
        if v_byte < 248 and length(v_raw) < 16 then  -- 248 = 31 * 8, rejection sampling
          v_raw := v_raw || substr(v_alphabet, (v_byte % 31) + 1, 1);
        end if;
      end loop;
    end loop;
    v_code := substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4) || '-'
           || substr(v_raw, 9, 4) || '-' || substr(v_raw, 13, 4);

    insert into public.redeem_codes (code_hash, code_hint, course_id, max_uses, expires_at, created_by)
    values (private.hash_secret(v_raw), right(v_raw, 4), p_course_id, p_max_uses, p_expires_at, v_admin)
    returning redeem_codes.id into v_id;

    id := v_id;
    code := v_code;
    return next;
  end loop;

  perform private.log_admin_action('create_redeem_codes', 'courses', p_course_id, null,
    jsonb_build_object('count', p_count, 'max_uses', p_max_uses, 'expires_at', p_expires_at));
end;
$$;

-- Devices: register the caller's current device and bind the current auth
-- session to it. p_device_key is a random secret held in an httpOnly cookie;
-- only its hash is stored.
create or replace function public.register_current_device(
  p_device_key text, p_device_name text default null, p_user_agent text default null,
  p_ip_address text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_session uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  v_hash text;
  v_device uuid;
begin
  if v_session is null then
    raise exception 'A signed-in session is required' using errcode = '42501';
  end if;
  if p_device_key is null or length(p_device_key) < 32 or length(p_device_key) > 256 then
    raise exception 'Invalid device key' using errcode = '22023';
  end if;
  v_hash := private.hash_secret(p_device_key);

  perform pg_advisory_xact_lock(hashtextextended('device_limit:' || v_uid::text, 0));

  select d.id into v_device from public.registered_devices d
  where d.user_id = v_uid and d.device_key_hash = v_hash;

  if v_device is null then
    if (select count(*) from public.registered_devices where user_id = v_uid) >= 2 then
      insert into public.device_events (user_id, event, actor_id) values (v_uid, 'limit_rejected', v_uid);
      return null;  -- caller must show the device-limit screen
    end if;
    insert into public.registered_devices (user_id, device_key_hash, device_name, user_agent, ip_address)
    values (v_uid, v_hash, left(p_device_name, 100), left(p_user_agent, 500), left(p_ip_address, 64))
    returning registered_devices.id into v_device;
    insert into public.device_events (user_id, device_id, event, actor_id)
    values (v_uid, v_device, 'registered', v_uid);
  else
    update public.registered_devices
       set last_used_at = now(), user_agent = left(p_user_agent, 500), ip_address = left(p_ip_address, 64)
     where registered_devices.id = v_device;
  end if;

  insert into public.user_sessions (user_id, device_id, auth_session_id)
  values (v_uid, v_device, v_session)
  on conflict (auth_session_id) do update
    set last_seen_at = now()
    where public.user_sessions.user_id = v_uid and public.user_sessions.device_id = v_device;

  if not exists (select 1 from public.user_sessions s
                 where s.auth_session_id = v_session and s.user_id = v_uid and s.device_id = v_device) then
    raise exception 'Session is bound to a different device' using errcode = '42501';
  end if;
  return v_device;
end;
$$;

-- Internal: remove a device and revoke the auth sessions bound to it.
create or replace function private.remove_device(p_device_id uuid, p_user_id uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions
   where user_id = p_user_id
     and id in (select s.auth_session_id from public.user_sessions s
                where s.device_id = p_device_id and s.user_id = p_user_id);
  delete from public.registered_devices where id = p_device_id and user_id = p_user_id;
  insert into public.device_events (user_id, device_id, event, actor_id)
  values (p_user_id, p_device_id, p_event, auth.uid());
end;
$$;

-- Students remove one of their own devices. Throttled against scripted abuse
-- (technical limit, not a business policy — see SECURITY_AUDIT.md).
create or replace function public.remove_my_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
begin
  perform pg_advisory_xact_lock(hashtextextended('device_limit:' || v_uid::text, 0));
  if not exists (select 1 from public.registered_devices where id = p_device_id and user_id = v_uid) then
    raise exception 'Device not found' using errcode = 'P0002';
  end if;
  if (select count(*) from public.device_events
      where user_id = v_uid and event = 'removed_by_user'
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many device removals. Try again later.' using errcode = 'LMS08';
  end if;
  perform private.remove_device(p_device_id, v_uid, 'removed_by_user');
end;
$$;

create or replace function public.admin_remove_device(p_device_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_user uuid;
begin
  select user_id into v_user from public.registered_devices where id = p_device_id;
  if not found then
    raise exception 'Device not found' using errcode = 'P0002';
  end if;
  perform private.remove_device(p_device_id, v_user, 'removed_by_admin');
  perform private.log_admin_action('remove_device', 'registered_devices', p_device_id, null,
    jsonb_build_object('user_id', v_user, 'reason', left(p_reason, 500)));
end;
$$;

-- V4: returns the private storage path for a lesson only to a caller with an
-- active, unexpired enrollment on a registered device (or an admin). The app
-- server converts the path into a short-lived signed URL.
create or replace function public.get_lesson_playback(p_lesson_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_course uuid;
  v_path text;
begin
  select l.course_id, m.storage_path into v_course, v_path
  from public.lessons l
  join public.courses c on c.id = l.course_id
  join public.lesson_media m on m.lesson_id = l.id
  where l.id = p_lesson_id and l.is_published and c.is_published;

  if private.is_admin() then
    if v_path is null then
      select m.storage_path into v_path from public.lesson_media m where m.lesson_id = p_lesson_id;
    end if;
    return v_path;
  end if;

  if v_course is null
     or private.has_active_enrollment(v_uid, v_course) is null
     or not private.current_session_on_registered_device(v_uid) then
    raise exception 'You do not have access to this lesson' using errcode = '42501';
  end if;
  return v_path;
end;
$$;

-- Progress for resume-watching. Requires the same access as playback.
create or replace function public.record_lesson_progress(
  p_lesson_id uuid, p_position_seconds integer, p_completed boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_course uuid;
  v_duration integer;
  v_enrollment uuid;
  v_position integer;
begin
  select l.course_id, l.duration_seconds into v_course, v_duration
  from public.lessons l join public.courses c on c.id = l.course_id
  where l.id = p_lesson_id and l.is_published and c.is_published;

  v_enrollment := case when v_course is null then null
                       else private.has_active_enrollment(v_uid, v_course) end;
  if v_enrollment is null or not private.current_session_on_registered_device(v_uid) then
    raise exception 'You do not have access to this lesson' using errcode = '42501';
  end if;

  v_position := greatest(0, coalesce(p_position_seconds, 0));
  if v_duration is not null then
    v_position := least(v_position, v_duration);
  end if;

  insert into public.lesson_progress as lp
    (user_id, lesson_id, enrollment_id, watched_seconds, is_completed, last_watched_at)
  values (v_uid, p_lesson_id, v_enrollment, v_position, coalesce(p_completed, false), now())
  on conflict (user_id, lesson_id, enrollment_id) do update
    set watched_seconds = excluded.watched_seconds,
        is_completed = lp.is_completed or excluded.is_completed,
        last_watched_at = now();
end;
$$;

-- Maintenance (service role / scheduler only). Return type changes, so drop first.
drop function if exists public.check_expired_enrollments();
create function public.check_expired_enrollments()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  update public.enrollments set status = 'expired'
   where status = 'active' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.cleanup_orphaned_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  delete from public.user_sessions s
   where not exists (select 1 from auth.sessions a where a.id = s.auth_session_id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Function privileges
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

grant execute on function
  public.redeem_code(text),
  public.submit_manual_payment(uuid, numeric, text, text, text),
  public.register_current_device(text, text, text, text),
  public.remove_my_device(uuid),
  public.get_lesson_playback(uuid),
  public.record_lesson_progress(uuid, integer, boolean),
  public.approve_manual_payment(uuid, text),
  public.reject_manual_payment(uuid, text),
  public.admin_grant_enrollment(uuid, uuid, timestamptz, text),
  public.admin_revoke_enrollment(uuid, text),
  public.admin_set_user_role(uuid, public.user_role),
  public.admin_create_redeem_codes(uuid, integer, integer, timestamptz),
  public.admin_remove_device(uuid, text)
to authenticated;

grant execute on function
  public.check_expired_enrollments(),
  public.cleanup_orphaned_sessions()
to service_role;

-- -----------------------------------------------------------------------------
-- 9. Private storage bucket for lesson videos (only if Storage is installed).
--    No storage.objects policies are created for it, so only the service role
--    (used server-side to mint short-lived signed URLs) can read it.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('lesson-videos', 'lesson-videos', false)
    on conflict (id) do update set public = false;
  end if;
end $$;
