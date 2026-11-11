# Implementation checklist — 2026-11-11

## Safety / inspection
- [x] Preserve Git history and inherited changes: baseline commit 8b9af21.
- [x] Inspect routes, components, schema, RLS, security report and actual dependencies.
- [x] Read complete Option 2 V3 prototype and place at requested reference path.
- [x] Baseline typecheck, lint, unit tests (20 pass).
- [ ] Baseline database/integration tests: blocked by Docker socket permission.
- [ ] Production build: blocked by sandbox port-binding restriction; see TEST_REPORT.md.
- [ ] Verify seven P0 issues against a running migrated database; source review is not proof of deployment.

## Implementation sequence
1. Extract optimized reference assets, document tokens, refine inherited homepage and reusable components.
2. Add additive security hardening and regression tests; keep new sensitive operations opt-in until verified.
3. Implement public course detail and student routes, real Supabase reads, payment/redeem actions and private storage.
4. Implement protected provider-agnostic player and progress/resume UI; no provider chosen implicitly.
5. Implement admin navigation, data views and authorized forms using existing RLS/RPCs.
6. Add Playwright desktop/mobile/tablet checks and screenshot comparison artifacts.
7. Run typecheck, lint, unit, build, DB/concurrency, integration and E2E; report failures/blockers honestly.
8. Commit source and documentation. Never deploy, apply remote migrations or change DNS without approval.

## External gates
Google provider credentials/redirect verification; approved payment instructions, pricing/currency/access terms; private Storage bucket verification; selected streaming provider and Myanmar-network evaluation; local Docker/browser/network permissions; release approval. No invented business defaults or fake success states.

## Current checkpoint
- [x] Design system, extracted assets, homepage refactor and reusable components.
- [x] Public course details and requested student/admin route source implementation.
- [x] Server-side validation, private receipt handling, gated streaming adapter and progress source implementation.
- [x] Additional revoked-session hardening migration and regression tests prepared.
- [x] TypeScript, ESLint and 66 unit tests pass.
- [x] Playwright suites prepared for 1440/768/375px; test discovery passes.
- [ ] Apply/test security migration and verify all P0 issues on a real database (Docker access blocked).
- [ ] Production build (sandbox prevents Turbopack worker port binding).
- [ ] Browser execution/screenshots/visual comparison (Chromium launch denied).
- [ ] End-to-end Google OAuth, real private Storage and provider/network acceptance.
- [ ] Distributed abuse limits and release operational controls.
- [ ] Production deployment: requires explicit approval; not performed.

This checklist deliberately distinguishes implemented source from verified runtime behavior. See TEST_REPORT.md, SECURITY_AUDIT.md and DEPLOYMENT.md for exact evidence and remaining acceptance gates.

Source checkpoint: `a14b87d`; prepared security migration: `d22794d`; inherited-work baseline: `8b9af21`.
