-- Additive hardening. Apply only after local tests and deployment approval.
-- The earlier app-only session check did not protect direct PostgREST RPCs.
create or replace function private.require_user()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.current_session_is_active() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return v_uid;
end $$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_session_is_active() and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function private.current_session_on_registered_device(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user_id = auth.uid() and public.current_session_is_active() and exists (
    select 1 from public.user_sessions s join public.registered_devices d on d.id = s.device_id
    where s.user_id = p_user_id and d.user_id = p_user_id
      and s.auth_session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

-- Protect even direct table reads/writes made with a revoked JWT. Public
-- catalog reads remain public; private rows and all admin writes fail closed.
do $$
declare t text;
begin
  foreach t in array array['profiles','enrollments','lesson_progress','manual_payments',
    'redeem_codes','redeem_code_usages','registered_devices','user_sessions','device_events',
    'admin_audit_logs','lesson_media'] loop
    execute format('create policy active_session_required on public.%I as restrictive for all to authenticated using ((select public.current_session_is_active())) with check ((select public.current_session_is_active()))', t);
  end loop;
end $$;

-- Reject new permanent URLs without destroying legacy rows. Existing legacy
-- paths must be reviewed/migrated before playback is enabled.
alter table public.lesson_media add constraint lesson_media_private_object_key
  check (storage_path !~ '(^/|:|[\\]|[?]|[#]|(^|/)\.\.(/|$))') not valid;

-- Server-side service client only: no public SELECT/upload policies.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;

-- Code deactivation must also leave audit history. Omit hashes from logs.
create or replace function private.audit_code_state()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.is_active is distinct from new.is_active then
    perform private.require_admin();
    perform private.log_admin_action('set_code_active', 'redeem_codes', new.id,
      jsonb_build_object('is_active', old.is_active), jsonb_build_object('is_active', new.is_active));
  end if;
  return new;
end $$;
create trigger audit_code_state after update of is_active on public.redeem_codes
  for each row execute function private.audit_code_state();

revoke all on function private.require_user(), private.current_session_on_registered_device(uuid), private.audit_code_state() from public, anon, authenticated;

-- Fail closed for legacy video URLs as well as new writes.
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
    if v_path ~ '(^/|:|[\\]|[?]|[#]|(^|/)\.\.(/|$))' then
      raise exception 'Private media is not configured' using errcode = 'LMS04';
    end if;
    return v_path;
  end if;

  if v_course is null
     or private.has_active_enrollment(v_uid, v_course) is null
     or not private.current_session_on_registered_device(v_uid) then
    raise exception 'You do not have access to this lesson' using errcode = '42501';
  end if;
  if v_path ~ '(^/|:|[\\]|[?]|[#]|(^|/)\.\.(/|$))' then
      raise exception 'Private media is not configured' using errcode = 'LMS04';
    end if;
    return v_path;
end;
$$;

