-- V3 redeem code exposure and redemption safety
begin;
select plan(17);

select tests.create_user('s1@example.com') as s1 \gset
select tests.create_user('s2@example.com') as s2 \gset
select tests.create_user('admin@example.com') as admin \gset
select tests.make_admin(:'admin');
select tests.create_course('code-course', 30) as course \gset
select tests.create_code(:'course', 'ABCD-EFGH-JKMN-PQRS', 1) as code1 \gset
select tests.create_code(:'course', 'MULTI-USE-CODE-0001', 5) as code_multi \gset
select tests.create_code(:'course', 'EXPIRED-CODE-0001', 5, now() - interval '1 day') as code_expired \gset

-- No plaintext code column exists any more
select hasnt_column('public', 'redeem_codes', 'code', 'V3 plaintext code column removed');

-- Students and anon cannot list codes
select tests.login_as(:'s1');
select is((select count(*)::int from public.redeem_codes), 0, 'V3 student cannot list redeem codes');
select tests.logout();
select tests.login_anon();
select throws_ok('select count(*) from public.redeem_codes', '42501', null, 'V3 anon cannot read redeem codes');
select tests.logout();

-- Even admins cannot read the hash column
select tests.login_as(:'admin');
select throws_ok('select code_hash from public.redeem_codes', '42501', null, 'V3 code hashes are not readable via API');
select is((select count(*)::int from public.redeem_codes), 3, 'admin can list code metadata');
select tests.logout();

-- Redemption is for the caller only: the function has no user-id parameter
select hasnt_function('public', 'redeem_code', array['text', 'uuid'], 'V7 old redeem_code(code, user_id) removed');

select tests.login_as(:'s1');
select lives_ok($$select public.redeem_code('abcd efgh jkmn pqrs')$$, 'student redeems a valid code (normalised)');
select tests.logout();
select is((select user_id from public.redeem_code_usages where redeem_code_id = :'code1'), :'s1'::uuid,
  'V7 redemption is recorded for the caller, not an arbitrary account');
select ok((select status = 'active' and source = 'redeem_code' and expires_at is not null
           from public.enrollments where user_id = :'s1'), 'redemption grants time-limited access');

-- Single-use code cannot be used by a second account
select tests.login_as(:'s2');
select throws_ok($$select public.redeem_code('ABCD-EFGH-JKMN-PQRS')$$, 'LMS02', null,
  'exhausted single-use code is rejected');
select tests.logout();
select is((select count(*)::int from public.enrollments where user_id = :'s2'), 0,
  'failed redemption did not grant access');

-- Duplicate redemption by the same user is blocked
select tests.login_as(:'s1');
select lives_ok($$select public.redeem_code('MULTI-USE-CODE-0001')$$, 'multi-use code first use works');
select throws_ok($$select public.redeem_code('MULTI-USE-CODE-0001')$$, 'LMS03', null,
  'same user cannot redeem the same code twice');
select throws_ok($$select public.redeem_code('EXPIRED-CODE-0001')$$, 'LMS02', null, 'expired code rejected');
select throws_ok($$select public.redeem_code('NOPE-NOPE-NOPE-NOPE')$$, 'LMS02', null, 'unknown code rejected');
select tests.logout();
select is((select current_uses from public.redeem_codes where id = :'code_multi'), 1,
  'denied duplicate did not increment usage');

-- Admin code generation returns plaintext once and stores only the hash
select tests.login_as(:'admin');
select is((select count(*)::int from public.admin_create_redeem_codes(:'course', 3, 1, null)), 3,
  'admin can generate codes');
select tests.logout();

select * from finish();
rollback;
