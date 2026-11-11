# Deployment runbook — approval required

**Nothing in this change has been deployed. Do not point DNS, change production processes or apply remote migrations without explicit approval.** Target domain: onlinelearning.ccone.app.

## Current release state
Not release-ready. Database/concurrency/integration tests, production build and browser comparisons cannot execute in the current restricted session. New admin mutations, payment submission, code redemption, playback and progress recording default to disabled through `LMS_SECURITY_VERIFIED=false`. That switch is a release gate, **not** authentication, RLS, or proof that a database is safe. It does not disable pre-existing direct Supabase RPC endpoints. Never expose an unremediated database.

## Versions
Node 22.23.4; Next 16.4.6; React/React DOM 19.3.0; Tailwind 4.3.3; TypeScript 5.9.3; ESLint 9.39.5; installed Supabase JS 2.119.0 / SSR 0.12.7; Playwright 1.65.0; Vitest 4.1.12. Existing framework versions were preserved. Sharp 0.35.5 was already installed transitively; it is now declared directly for receipt decoding and design-image extraction. Offline lockfile regeneration was blocked by a missing cached Tailwind optional package; the existing lock entries were retained and direct-dependency metadata updated. A clean `npm ci` remains a release check.

## Before staging
1. Back up the database, Storage metadata/objects and deployed app. Record deployed Git SHA and migration ledger.
2. Use an isolated local/staging database. Do **not** run `supabase db reset` against shared/production data. Inspect all migration files and apply the outstanding migrations only after review.
3. Run the complete suites with Docker/network/browser privileges in an approved environment:
   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run test:db
   npm run test:integration
   npm run test:e2e
   npm run build
   ```
   `test:db` requires the local Supabase container. Its concurrency suite creates/removes only test fixtures. Integration/E2E are restricted to loopback Supabase; do not override them for hosted production.
4. Review `20261111000004_session_and_private_media.sql`: live-session enforcement for direct RPC/RLS access, legacy-media-URL rejection and private receipts. It has **not** been applied or database-tested in this session. Do not mark P0 vulnerabilities closed based on source review alone.
5. Replace any legacy `lesson_media.storage_path` permanent URLs with private object keys. After inventory and backup, validate `lesson_media_private_object_key` in staging; the migration uses NOT VALID to preserve existing records but the playback RPC fails closed on legacy URL strings.

## Configuration
- Public: `NEXT_PUBLIC_APP_URL=https://onlinelearning.ccone.app`, project-specific Supabase URL and publishable key. Build-time public variables must match the target environment.
- Server-only: `SUPABASE_SECRET_KEY`. Never prefix a secret with `NEXT_PUBLIC_`, commit env files, or include it in browser tests/artifacts.
- Google OAuth: configure approved Google client credentials in Supabase; restrict redirects to the exact callback and site origin. Verify real consent, first-time profile creation, returning sign-in, sign-out, and session revocation. Local minted-session tests are **not** real Google OAuth verification.
- `MANUAL_PAYMENT_INSTRUCTIONS`: approved plain-text instructions. Missing instructions keep payment submission closed. Configure actual prices/currency/access days in admin; never seed invented business terms.
- Storage: `payment-receipts` private, max 5 MB, JPEG/PNG/WebP only; `lesson-videos` private. Audit ALL existing Storage policies and bucket publicity. Routes recheck private status before uploads/signing; no public object policies are added. Test upload, owner/admin receipt reads, denial for other users, expiry, cleanup on failure, and public URL denial.
- `STREAMING_PROVIDER`: leave unset until selected and tested. `supabase` selects the implemented short-lived private-Storage adapter, not a product decision. `LESSON_VIDEO_BUCKET` defaults to the infrastructure bucket `lesson-videos`, not an access term. Playback grants default to 120 seconds; SIGNED_URL_TTL_SECONDS allows 30–300 seconds and never exceeds enrollment expiry (signer caps all requests at 300 seconds). The current player asks users to renew authorization when a grant expires; seamless renewal/adaptive streaming and captions need provider-specific acceptance tests.
- Only set `LMS_SECURITY_VERIFIED=true` after migrations, P0 regressions, concurrency and Storage/integration tests pass on the intended environment. Leave it false if any test is blocked.

## Remaining release gates
- Apply edge/distributed rate limits to auth, redeem, receipt upload and playback routes **and direct RPC access**. Existing device-removal throttling remains intact. Do not enable new sensitive features until abuse controls are reviewed.
- Verify TLS/reverse-proxy host/origin forwarding, secure cookies, no caching on private routes and signed responses; remove signed links from access logs. CSP currently covers frame ancestors, objects and base URI; a nonce-based script policy is still needed.
- Test all admin writes and audit records, missing-row/duplicate submissions, concurrent approvals, enrollment expiry and revoked devices through the browser.
- Review dependency advisories in an online environment. Verify clean install/build, memory limits, provider behavior on Myanmar internet connections, video subtitles and mobile playback.
- Review screenshots at 1440, 768 and 375px. No Figma pixel-equivalence claim is made.
- Verify privacy/retention policies for receipts and orphan-object cleanup; do not remove evidence automatically without an approved policy.

## Approved deployment and rollback
After explicit approval, deploy a reviewed immutable commit/build to staging first. Take a production backup before approved migrations; keep old binaries for rollback. Never automatically reverse security migrations to the vulnerable schema. If issues arise, disable new sensitive features and restore an approved application build; any database rollback requires its own reviewed recovery plan. DNS/process restarts and production migrations are outside this implementation session.
