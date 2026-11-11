-- Content field validation and public visibility for homepage data
begin;
select plan(10);

select tests.create_user('admin@example.com') as admin \gset
select tests.make_admin(:'admin');

select throws_ok($$insert into public.homepage_banners (title, image_url, link_url) values ('x', '/images/a.jpg', 'javascript:alert(1)')$$,
  '23514', null, 'javascript: banner link rejected');
select throws_ok($$insert into public.homepage_banners (title, image_url, link_url) values ('x', '/images/a.jpg', '//evil.example')$$,
  '23514', null, 'protocol-relative banner link rejected');
select throws_ok($$insert into public.homepage_banners (title, image_url) values ('x', 'data:image/png;base64,AAAA')$$,
  '23514', null, 'data: banner image rejected');
select lives_ok($$insert into public.homepage_banners (title, eyebrow, image_url, link_url) values ('Ok', 'DEALS & UPDATES', '/images/a.jpg', '/courses')$$,
  'same-site banner accepted');
select lives_ok($$insert into public.homepage_banners (title, image_url, link_url, is_active) values ('Ok2', 'https://cdn.example/a.jpg', 'https://example.com/x', false)$$,
  'https banner accepted');
select throws_ok($$insert into public.courses (title, slug, thumbnail_url) values ('c', 'c-bad', 'javascript:x')$$,
  '23514', null, 'unsafe course thumbnail rejected');

-- Anon sees only active banners; students cannot write banners.
select tests.login_anon();
select is((select count(*)::int from public.homepage_banners), 1, 'anon sees only the active banner');
select tests.logout();
select tests.create_user('s@example.com') as s \gset
select tests.login_as(:'s');
select throws_ok($$insert into public.homepage_banners (title, image_url) values ('x', '/images/a.jpg')$$,
  '42501', null, 'student cannot create banners');
select tests.logout();
select tests.login_as(:'admin');
select lives_ok($$update public.homepage_banners set eyebrow = 'NEW' where title = 'Ok'$$, 'admin can edit banners');
select tests.logout();
select is((select count(*)::int from public.admin_audit_logs where entity_type = 'homepage_banners' and action = 'update'), 1,
  'banner edit was audited');

select * from finish();
rollback;
