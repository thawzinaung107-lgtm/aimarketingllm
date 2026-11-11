# Option 2 V3 design system

Source: `design-reference/option2-v3.html`, copied byte-for-byte from Claude's standalone handoff on 2026-11-11. The entire document (markup, styles, interaction script, and embedded-image inventory) was inspected. This is an approximate interactive prototype, not all 66 Figma screens, and not application/security logic.

## Tokens
| Token | Value |
|---|---|
| Primary black | #111214 |
| Charcoal | #1d1f22 |
| Text | #18191b |
| Secondary text | #686d74 |
| Borders | #e4e6e9 |
| Background | #ffffff |
| Soft surface | #f5f6f7 |
| Hero surface | #17191c |
| Focus ring | #6a8bc5 (3px, 3px offset) |

Inter, system sans-serif fallback; body 14px/1.6. H1 clamp(31px,4vw,49px), line-height 1.13, tracking -1.8px. Hero heading max 48px; H2 clamp(24px,3vw,34px)/1.22; H3 18px. Labels 11–12px; buttons 13px/650; eyebrows 11px/750 with 1.2px uppercase tracking. Use premium minimal neutral surfaces, not invented promotional badges.

## Measurements and responsive behavior
- Container max 1240px, horizontal padding 30px; 18px at <=800px.
- Header 79px desktop / 69px mobile. Navigation collapses at 800px with a real menu button, Escape handling, and aria-expanded.
- Main top/bottom padding 35/72px. Section gaps 74px desktop / 49px mobile.
- Hero columns 53/47%, min-height 385px, radius 18px. Copy padding 55px 46px; mobile 36px 25px. Image min-height 350px / 230px mobile. Subtle gradient from dark copy to image.
- Carousel controls below hero: counter, indicators, pause/resume, previous/next; 6000ms interval. Pause for hidden document, focus, hover, reduced-motion preference. No offer/pricing invention; database banners replace neutral fallbacks.
- Course grid 2 columns, 20px gap; one column <=800px. Image 170px, card radius 15px, body padding 24px. Search max 440px; category buttons wrap.
- Learning steps 4 columns, 14px gap; 2 at <=800px / 1 at <=480px. CTA padding 40px / 28px mobile.
- Detail/player/form layout 1.5fr 1fr, gap 22px, one column <=800px.
- Dashboard sidebar 230px, charcoal surface, 23px padding; content min-width:0. Stats three columns, stack <=480px. Tables scroll within their panel, never the viewport.
- Panels radius 15px / padding 28px; inputs radius 9px / padding 12px 13px; buttons radius 9px and minimum 42px height.

## Page structure
Homepage: header → dark promotion → controls → search/filter/catalog → learning steps → CTA → footer.
Public: catalog, course detail with real lesson metadata and configured terms, Google sign-in.
Student: learning overview, payments/redeem, profile/devices; protected player beside lesson navigation.
Admin: charcoal sidebar, title, real stats, white panels and data tables, validated forms.

## Assets
Four embedded data URI occurrences reduce to two unique photographs. `scripts/extract-design-images.mjs` extracts/optimizes them as WebP; `images.json` records source hashes and byte counts. Runtime React contains no base64 or prototype scripts. Existing JPEG assets remain for compatibility with stored CMS records. Images are decorative where adjacent text conveys the meaning. No new stock imagery was invented.

## Components and interaction
Reusable CourseCard/Grid/Search/Filters, SiteHeader/Footer, MobileNavigation, PromotionalCarousel, student/admin navigation, DashboardStats, CourseDetail, PaymentForm, RedeemForm, LessonPlayer/Navigation, loading/empty/error states and ConfirmationDialog. Existing shadcn configuration is present but no generated shadcn components existed at baseline; shared native accessible primitives follow that configuration without adding unverified dependencies.

Production copy deliberately differs from the prototype: no fake courses/enrollments/stats, no fabricated durations, discounts or currencies; payment approval and code redemption are alternate access paths in the existing schema. Errors never become success screens. No iframe or dangerouslySetInnerHTML is used.

## Implementation notes
`components/ui/button.tsx` is a native-button shadcn-style primitive built on the existing `class-variance-authority` / `cn` stack; no Radix or alternate design library was added. Native `<dialog>` provides modal focus containment and Escape dismissal. Three hero slots are maintained: configured active banners first, then only neutral informational fallbacks for missing slots. Screenshot comparisons are **not yet executed** in this sandbox; see TEST_REPORT.md.

Authenticated header adaptation: the production menu collapses at 1100px (rather than the prototype’s 800px) to accommodate real account/admin links without overlap. Content-grid breakpoints remain 800px and 480px.
