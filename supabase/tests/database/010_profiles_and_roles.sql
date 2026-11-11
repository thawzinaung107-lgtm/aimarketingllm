-- V1 privilege escalation, V5 recursion, V6 profile creation
begin;
select plan(17);

select tests.create_user('student@example.com', '{"full_name":"Stu Dent"}') as student \gset
select tests.create_user('evil@example.com', '{"full_name":"Evil","role":"admin"}') as evil \gset
select tests.create_user('admin@example.com') as admin \gset
select tests.make_admin(:'admin');

-- V6: first-time sign-in creates a profile, always as student
select is((select role::text from public.profiles where id = :'student'), 'student',
  'V6 first login creates a student profile');
select is((select full_name from public.profiles where id = :'student'), 'Stu Dent',
  'V6 display name copied from provider metadata');
select is((select role::text from public.profiles where id = :'evil'), 'student',
  'V6 role in user metadata is ignored; new users are always students');
select is((select count(*)::int from public.profiles where id = :'student'), 1,
  'V6 exactly one profile row per user');

-- V6: returning login (a second auth event for the same user) does not duplicate or reset
update auth.users set last_sign_in_at = now() where id = :'student';
select is((select count(*)::int from public.profiles where id = :'student'), 1,
  'V6 returning login does not duplicate the profile');

-- V1: student cannot promote themselves
select tests.login_as(:'student');
select throws_ok(
  format($$update public.profiles set role = 'admin' where id = %L$$, :'student'),
  '42501', null, 'V1 student cannot set own role to admin');
select throws_ok(
  format($$update public.profiles set email = 'x@example.com' where id = %L$$, :'student'),
  '42501', null, 'V1 student cannot change own email');
select lives_ok(
  format($$update public.profiles set full_name = 'New Name' where id = %L$$, :'student'),
  'V1 student can still update own display name');
select throws_ok(
  format($$insert into public.profiles (id, email, role) values (gen_random_uuid(), 'a@b.c', 'admin')$$),
  '42501', null, 'V1 student cannot insert profiles');
select throws_ok('select public.admin_set_user_role(auth.uid(), ''admin'')',
  '42501', null, 'V1 student cannot call admin_set_user_role');
-- Student only sees their own profile (and cannot see other users)
select is((select count(*)::int from public.profiles), 1, 'V1 student sees only own profile');
select tests.logout();
select is((select role::text from public.profiles where id = :'student'), 'student',
  'V1 denied attempts left role unchanged');

-- V5: admin policies evaluate without recursion and admins can read all profiles
select tests.login_as(:'admin');
select lives_ok('select count(*) from public.profiles', 'V5 admin profile query does not recurse');
select cmp_ok((select count(*)::int from public.profiles), '>=', 3, 'V5 admin can read all profiles');
select lives_ok(format('select public.admin_set_user_role(%L, ''admin'')', :'evil'),
  'admin can change another user''s role via audited function');
select throws_ok(format('select public.admin_set_user_role(%L, ''student'')', :'admin'),
  '42501', null, 'admin cannot change own role');
select tests.logout();
select is((select count(*)::int from public.admin_audit_logs where action = 'set_role' and entity_id = :'evil'), 1,
  'role change was audited');

select * from finish();
rollback;
