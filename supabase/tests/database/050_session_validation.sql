begin;
select plan(3);
select tests.create_user('sess@example.com') as u \gset
select tests.create_session(:'u') as sess \gset
select tests.login_as(:'u', :'sess');
select ok(public.current_session_is_active(), 'live session is active');
select tests.logout();
delete from auth.sessions where id = :'sess';
select tests.login_as(:'u', :'sess');
select ok(not public.current_session_is_active(), 'deleted session is inactive even with a valid JWT');
select tests.logout();
select tests.login_anon();
select throws_ok('select public.current_session_is_active()', '42501', null, 'anon cannot call it');
select tests.logout();
select * from finish();
rollback;
