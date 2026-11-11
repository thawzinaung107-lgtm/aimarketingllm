-- Content fields required by the Option 2 V3 design, plus URL safety checks.

-- Promotion banner eyebrow label (e.g. "DEALS & UPDATES").
alter table public.homepage_banners
  add column eyebrow text check (eyebrow is null or length(eyebrow) <= 40);

-- Banner/thumbnail URLs are rendered as links and images. Allow only
-- same-site paths or https URLs, so a compromised or careless admin entry
-- cannot inject javascript:/data: URLs or protocol-relative links.
alter table public.homepage_banners
  add constraint homepage_banners_link_url_safe
    check (link_url is null or link_url ~ '^(/[^/\\]|/$|https://)'),
  add constraint homepage_banners_image_url_safe
    check (image_url ~ '^(/[^/\\]|https://)'),
  add constraint homepage_banners_title_length check (length(title) between 1 and 120),
  add constraint homepage_banners_description_length check (description is null or length(description) <= 300);

-- Course category drives the catalogue filter chips (e.g. "AI Marketing").
alter table public.courses
  add column category text check (category is null or length(category) between 1 and 40),
  add constraint courses_thumbnail_url_safe
    check (thumbnail_url is null or thumbnail_url ~ '^(/[^/\\]|https://)');
