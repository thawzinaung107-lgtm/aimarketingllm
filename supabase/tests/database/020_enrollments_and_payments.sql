-- V2 free enrollment, V7 payment approval, expiry, admin grants
begin;
select plan(22);

select tests.create_user('s1@example.com') as s1 \gset
select tests.create_user('s2@example.com') as s2 \gset
select tests.create_user('admin@example.com') as admin \gset
select tests.make_admin(:'admin');
select tests.create_course('pay-course', 30) as course \gset

-- V2: students cannot write enrollments directly
select tests.login_as(:'s1');
select throws_ok(
  format($$insert into public.enrollments (user_id, course_id, status, enrolled_at, expires_at)
           values (%L, %L, 'active', now(), now() + interval '1 year')$$, :'s1', :'course'),
  '42501', null, 'V2 student cannot insert an active enrollment');
select throws_ok(
  format($$insert into public.enrollments (user_id, course_id) values (%L, %L)$$, :'s1', :'course'),
  '42501', null, 'V2 student cannot insert any enrollment');
select throws_ok(
  format($$insert into public.manual_payments (user_id, course_id, amount, status)
           values (%L, %L, 0, 'approved')$$, :'s1', :'course'),
  '42501', null, 'V2 student cannot insert a pre-approved payment row');

-- Submitting a payment grants nothing
select lives_ok(format('select public.submit_manual_payment(%L, 1000, ''REF-1'')', :'course'),
  'student can submit a manual payment');
select tests.logout();
select is((select count(*)::int from public.enrollments where user_id = :'s1'), 0,
  'V2 submitting a payment does not create an enrollment');
select id as payment from public.manual_payments where user_id = :'s1' \gset

-- Student cannot update their payment to approved or approve it
select tests.login_as(:'s1');
select throws_ok(format($$update public.manual_payments set status = 'approved' where id = %L$$, :'payment'),
  '42501', null, 'V7 student cannot update payment status');
select throws_ok(format('select public.approve_manual_payment(%L)', :'payment'),
  '42501', null, 'V7 student cannot approve payments');
select throws_ok(format('select public.submit_manual_payment(%L, 1000)', :'course'),
  'LMS06', null, 'duplicate pending payment for same course is rejected');
select tests.logout();

-- Another student cannot approve or see it
select tests.login_as(:'s2');
select throws_ok(format('select public.approve_manual_payment(%L)', :'payment'),
  '42501', null, 'V7 other student cannot approve payments');
select is((select count(*)::int from public.manual_payments), 0, 'other student cannot see the payment');
select tests.logout();

-- Anon cannot call it at all
select tests.login_anon();
select throws_ok(format('select public.approve_manual_payment(%L)', :'payment'),
  '42501', null, 'V7 anon cannot approve payments');
select tests.logout();

select is((select status::text from public.manual_payments where id = :'payment'), 'pending',
  'denied approval attempts did not change payment status');
select is((select count(*)::int from public.enrollments where user_id = :'s1'), 0,
  'denied approval attempts did not create an enrollment');

-- Real admin approval works and derives admin identity from auth.uid()
select tests.login_as(:'admin');
select lives_ok(format('select public.approve_manual_payment(%L, ''checked bank transfer'')', :'payment'),
  'admin can approve payment');
select throws_ok(format('select public.approve_manual_payment(%L)', :'payment'),
  'LMS07', null, 'payment cannot be approved twice');
select tests.logout();
select is((select reviewed_by from public.manual_payments where id = :'payment'), :'admin'::uuid,
  'V7 reviewed_by is the real calling admin');
select ok((select status = 'active' and source = 'manual_payment'
                  and expires_at between now() + interval '29 days' and now() + interval '31 days'
           from public.enrollments where user_id = :'s1' and course_id = :'course'),
  'approval granted time-limited access using the course''s configured duration');
select is((select count(*)::int from public.admin_audit_logs where action = 'approve_payment' and entity_id = :'payment'), 1,
  'approval was audited');

-- Admins cannot approve their own payment
select tests.login_as(:'admin');
select public.submit_manual_payment(:'course', 1000) as admin_payment \gset
select throws_ok(format('select public.approve_manual_payment(%L)', :'admin_payment'),
  '42501', null, 'admin cannot approve own payment');
select tests.logout();

-- Expiry: expired enrollments are rejected and swept
update public.enrollments set expires_at = now() - interval '1 minute' where user_id = :'s1';
select is(private.has_active_enrollment(:'s1', :'course'), null, 'expired enrollment does not count as access');
select is(public.check_expired_enrollments(), 1, 'expiry sweep marks the enrollment expired');

-- Admin grant requires future expiry and a reason
select tests.login_as(:'admin');
select throws_ok(format('select public.admin_grant_enrollment(%L, %L, null, ''comp'')', :'s2', :'course'),
  '22023', null, 'admin grant without an expiry is rejected');
select tests.logout();

select * from finish();
rollback;
