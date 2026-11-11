-- V4 video URL protection, device limits, anon access, grants hygiene
begin;
select plan(26);

select tests.create_user('s1@example.com') as s1 \gset
select tests.create_user('s2@example.com') as s2 \gset
select tests.create_user('admin@example.com') as admin \gset
select tests.make_admin(:'admin');
select tests.create_course('video-course', 30) as course \gset
select tests.first_lesson(:'course') as lesson \gset
select tests.create_session(:'s1') as s1_sess \gset
select tests.create_session(:'s2') as s2_sess \gset

-- V4: no video source column on the publicly readable lessons table
select hasnt_column('public', 'lessons', 'video_url', 'V4 video_url removed from public lessons table');

select tests.login_anon();
select is((select count(*)::int from public.lessons), 1, 'anon can see published lesson metadata');
select throws_ok('select storage_path from public.lesson_media', '42501', null, 'V4 anon cannot read lesson media');
select throws_ok(format('select public.get_lesson_playback(%L)', :'lesson'), '42501', null,
  'V4 anon cannot get playback');
-- Anon cannot read private data
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.enrollments', '42501', null, 'anon cannot read enrollments');
select throws_ok('select * from public.manual_payments', '42501', null, 'anon cannot read payments');
select throws_ok('select * from public.registered_devices', '42501', null, 'anon cannot read devices');
select throws_ok('select * from public.admin_audit_logs', '42501', null, 'anon cannot read audit logs');
select tests.logout();

-- Not enrolled: no access
select tests.login_as(:'s1', :'s1_sess');
select is((select count(*)::int from public.lesson_media), 0, 'V4 student cannot read lesson_media directly');
select throws_ok(format('select public.get_lesson_playback(%L)', :'lesson'), '42501', null,
  'V4 unenrolled student cannot get playback');
select tests.logout();

-- Enrolled but session not bound to a registered device: no access
insert into public.enrollments (user_id, course_id, status, enrolled_at, expires_at, source)
values (:'s1', :'course', 'active', now(), now() + interval '10 days', 'admin');
select tests.login_as(:'s1', :'s1_sess');
select throws_ok(format('select public.get_lesson_playback(%L)', :'lesson'), '42501', null,
  'enrolled student on unregistered device cannot get playback');
-- Register device through the API, then playback works
select ok(public.register_current_device(repeat('a', 40), 'Laptop') is not null, 'student registers device 1');
select is(public.get_lesson_playback(:'lesson'), 'courses/video-course/lesson-1.mp4',
  'enrolled student on registered device gets the private storage path');
select lives_ok(format('select public.record_lesson_progress(%L, 120)', :'lesson'), 'progress recorded');
select tests.logout();

-- Expired enrollment is rejected
update public.enrollments set expires_at = now() - interval '1 second' where user_id = :'s1';
select tests.login_as(:'s1', :'s1_sess');
select throws_ok(format('select public.get_lesson_playback(%L)', :'lesson'), '42501', null,
  'expired enrollment cannot get playback');
select throws_ok(format('select public.record_lesson_progress(%L, 130)', :'lesson'), '42501', null,
  'expired enrollment cannot record progress');
select tests.logout();

-- Device limit
select tests.login_as(:'s1', tests.create_session(:'s1'));
select ok(public.register_current_device(repeat('b', 40), 'Phone') is not null, 'student registers device 2');
select tests.logout();
select tests.login_as(:'s1', tests.create_session(:'s1'));
select is(public.register_current_device(repeat('c', 40), 'Third'), null, 'third device is refused');
select throws_ok(format($$insert into public.registered_devices (user_id, device_key_hash) values (%L, 'x')$$, :'s1'),
  '42501', null, 'direct device insert is denied');
select tests.logout();
select throws_ok(format($$insert into public.registered_devices (user_id, device_key_hash) values (%L, 'x')$$, :'s1'),
  'LMS01', null, 'device limit is enforced even for privileged inserts');
select is((select count(*)::int from public.registered_devices where user_id = :'s1'), 2,
  'user still has exactly two devices');

-- Device removal: ownership + session revocation
select id as dev1 from public.registered_devices where user_id = :'s1' and device_name = 'Laptop' \gset
select tests.login_as(:'s2', :'s2_sess');
select throws_ok(format('select public.remove_my_device(%L)', :'dev1'), 'P0002', null,
  'student cannot remove another user''s device');
select tests.logout();
select tests.login_as(:'s1', :'s1_sess');
select lives_ok(format('select public.remove_my_device(%L)', :'dev1'), 'student removes own device');
select tests.logout();
select is((select count(*)::int from auth.sessions where id = :'s1_sess'), 0,
  'removing a device revokes the auth session bound to it');

-- Function privilege hygiene: no SECURITY DEFINER function in public is
-- executable by anon, and all have a fixed search_path.
select is((select count(*)::int from pg_proc p
           where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
             and p.prosecdef
             and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')),
  0, 'every SECURITY DEFINER function pins search_path');

select * from finish();
rollback;
