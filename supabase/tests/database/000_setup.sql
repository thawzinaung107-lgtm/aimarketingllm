-- Shared helpers for pgTAP tests. This file runs first (alphabetical order) and
-- commits test helper functions into the `tests` schema of the LOCAL database
-- only. It contains no assertions of its own beyond a single sanity check.
begin;
create extension if not exists pgtap with schema extensions;
create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

-- Create an auth user exactly as GoTrue would (insert into auth.users), which
-- fires the on_auth_user_created trigger under test.
create or replace function tests.create_user(p_email text, p_meta jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data,
                          created_at, updated_at, email_confirmed_at)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          p_email, p_meta, '{"provider":"google","providers":["google"]}', now(), now(), now());
  return v_id;
end $$;

-- Test-only promotion (runs as postgres, i.e. the trusted server side).
create or replace function tests.make_admin(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  update public.profiles set role = 'admin' where id = p_user;
$$;

-- Create an auth session row and return its id.
create or replace function tests.create_session(p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.sessions (id, user_id, created_at, updated_at) values (v_id, p_user, now(), now());
  return v_id;
end $$;

-- Act as a signed-in user with a given session id (as PostgREST would).
create or replace function tests.login_as(p_user uuid, p_session uuid default null)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', p_user, 'role', 'authenticated',
    'session_id', coalesce(p_session::text, tests.create_session(p_user)::text))::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.login_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;

create or replace function tests.logout()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- A published, fully configured course + one published lesson with media.
-- Price/currency/duration are neutral TEST values, not business terms.
create or replace function tests.create_course(p_slug text, p_duration_days integer default 30)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_course uuid; v_lesson uuid;
begin
  insert into public.courses (title, slug, price, currency, access_duration_days, is_published)
  values ('Test course ' || p_slug, p_slug, 1000, 'MMK', p_duration_days, true)
  returning id into v_course;
  insert into public.lessons (course_id, title, is_published, duration_seconds)
  values (v_course, 'Lesson 1', true, 600) returning id into v_lesson;
  insert into public.lesson_media (lesson_id, storage_path)
  values (v_lesson, 'courses/' || p_slug || '/lesson-1.mp4');
  return v_course;
end $$;

create or replace function tests.first_lesson(p_course uuid)
returns uuid language sql security definer set search_path = '' as $$
  select id from public.lessons where course_id = p_course order by created_at limit 1;
$$;

-- Insert a redeem code with a known plaintext (test-only).
create or replace function tests.create_code(p_course uuid, p_plain text, p_max_uses integer default 1,
                                             p_expires timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.redeem_codes (code_hash, code_hint, course_id, max_uses, expires_at)
  values (private.hash_secret(private.normalize_redeem_code(p_plain)),
          right(private.normalize_redeem_code(p_plain), 4), p_course, p_max_uses, p_expires)
  returning id into v_id;
  return v_id;
end $$;

-- Register a device + bind a session for a user, bypassing the API (setup only).
create or replace function tests.bind_device(p_user uuid, p_session uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_dev uuid;
begin
  insert into public.registered_devices (user_id, device_key_hash, device_name)
  values (p_user, private.hash_secret(gen_random_uuid()::text), 'test device') returning id into v_dev;
  insert into public.user_sessions (user_id, device_id, auth_session_id) values (p_user, v_dev, p_session);
  return v_dev;
end $$;

grant execute on all functions in schema tests to anon, authenticated;

select plan(1);
select has_function('tests', 'create_user', array['text', 'jsonb'], 'test helpers installed');
select * from finish();
commit;
