begin;
select plan(5);
select tests.create_user('revoked-rpc@example.com') as uid \gset
select tests.create_course('revoked-rpc') as cid \gset
select tests.create_session(:'uid') as sid \gset
select tests.make_admin(:'uid');
select tests.login_as(:'uid', :'sid');
select is(public.current_session_is_active(), true, 'fixture session active');
select tests.logout();
delete from auth.sessions where id = :'sid';
select tests.login_as(:'uid', :'sid');
select throws_ok(format('select public.submit_manual_payment(%L, 1000)', :'cid'), '42501', 'Authentication required', 'revoked user cannot submit directly');
select throws_ok('select public.redeem_code(''ANY-CODE'')', '42501', 'Authentication required', 'revoked user cannot redeem directly');
select throws_ok(format('select public.admin_create_redeem_codes(%L, 1)', :'cid'), '42501', 'Admin access required', 'revoked admin cannot generate codes');
select is((select count(*)::int from public.profiles), 0, 'revoked JWT cannot read private rows');
select * from finish();
rollback;
