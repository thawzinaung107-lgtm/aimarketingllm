# Current verification addendum — 2026-11-11

**This section supersedes the historical audit below for the current working tree. No production database was inspected or modified. The historical passing counts must not be treated as results from this implementation session.**

## Actual verification status
- Baseline: typecheck/lint pass, 20 unit tests pass.
- Current automated unit suite: 66 tests pass, including mocked payment/streaming/admin authorization boundaries. These are not live Storage or database tests.
- Database/pgTAP/concurrency and HTTP integration: blocked by denied Docker socket access. **Zero database assertions executed in this session.**
- Production build: blocked by Turbopack CSS worker port binding (`Operation not permitted`).
- Chromium: launch denied by sandbox (`sandbox_host_linux.cc`, operation not permitted). No screenshot or browser-security acceptance result is claimed.
- New sensitive routes/actions default closed through `LMS_SECURITY_VERIFIED=false`. Existing direct Supabase endpoints still require all migrations and their own authorization; this gate is not a replacement for RLS.

## Seven P0 checks — source review, not deployment verification
| Issue | Current source finding | Acceptance status |
|---|---|---|
| Student role escalation | Column grants, profile guard trigger, student-only auth-user trigger and admin RPC in existing remediation | Runtime re-test blocked |
| Student paid self-enrollment | No client enrollment writes; approval/redemption/admin exception RPCs only | Runtime re-test blocked |
| Public redeem-code listing | Admin-only metadata, hash column not granted, code row locking | Runtime/concurrency re-test blocked |
| Permanent video URL leakage | Separate admin-only media table; guarded route, private-bucket signing and TTL capped by enrollment; added rejection of legacy URL strings in RPC | Unit boundary checks pass; DB/Storage tests blocked; provider unset |
| Recursive admin RLS | SECURITY DEFINER private.is_admin queries profiles as owner | Runtime re-test blocked |
| Google student profile creation | Trigger derives role as student, ignores role metadata | Real Google consent/callback credentials unverified |
| Privileged SQL caller identity | Existing public privileged RPCs use auth.uid helpers; new session hardening extends them | Runtime re-test blocked |

## Additional finding: direct Data API session bypass
The previous `current_session_is_active()` check was only called by the application, and private.require_user/private.is_admin did not require a live session. A revoked JWT could therefore continue invoking direct privileged RPCs until token expiry; orphaned device-session rows could also remain after sign-out.

Prepared migration `20261111000004_session_and_private_media.sql`:
- Requires a live auth session in private.require_user and private.is_admin.
- Requires live session, matching user and registered device in playback/progress device check.
- Adds restrictive live-session policies to private tables, without making catalog reads private.
- Rejects new permanent video URLs and fails closed on legacy URL values. Existing rows are not destroyed.
- Creates/locks down the private payment-receipts bucket, if Storage schema exists.
- Audits redeem-code state changes without logging code hashes.
- Adds pgTAP direct revoked-user/admin RPC tests; test helpers now mint real auth.sessions rows.

**This migration is unexecuted and must be reviewed/tested before release.** No claim of closing the additional vulnerability on the VPS database is made.

## New application controls
- Admin layout/pages and every mutation independently require a verified server-side admin role. No role editor or client-controlled identity escalation was added.
- Receipt upload requires same-origin POST, verified session, release gate, approved payment instructions, bounded request bytes, actual image decoding/re-encoding, and private-bucket validation. Server chooses owner-prefixed random keys; failed submission attempts remove their uploaded object. Only pending payment RPC is called.
- Private receipt reads require owner or admin plus RLS and a bounded 60-second signature. No public receipt URLs are stored.
- Playback checks RPC enrollment/device authorization and current enrollment expiry, rejects permanent URLs, uses an explicitly selected provider and returns no-store short-lived grants. Student page payloads contain metadata/progress, not media paths.
- Input validation on admin/student actions, safe same-site CMS links, native confirmation dialog for device removal, cross-origin sign-out rejection, nosniff/referrer/frame headers and a limited frame/object/base CSP.

## Remaining blockers / risk acceptance required
1. Apply and exercise security migrations against isolated local/staging DB, then an explicitly approved target. Audit existing Storage policies; creating a private bucket alone does not remove pre-existing permissive policies.
2. Real Google OAuth, live Storage upload/signature/expiry tests, full payment flow and browser tests remain unverified.
3. Distributed throttling for redemption, receipt uploads, playback and auth, including direct RPC endpoints, is still required before enabling sensitive features. Device-removal throttling already exists.
4. Signed media grants are bearer tokens valid until their short expiry. Device revocation stops new grants; it cannot retract already issued links instantly. Browser hardware binding is not possible.
5. Current player requires authorization renewal at grant expiry; seamless/adaptive playback and subtitles depend on selected provider. Myanmar-network evaluation is outstanding.
6. Full nonce-based script CSP, online dependency advisory review, production cookie/proxy configuration, receipt retention/orphan cleanup, operational monitoring and clean-install/build acceptance remain open.
7. The first-admin bootstrap stays a trusted operational procedure. Do not enable arbitrary privilege changes from browser metadata.

---

# Historical audit (preserved for provenance; not current-run results)

# Security Audit — AI Marketing LMS

**Date:** 2026-11-11 · **Scope:** Supabase schema/RLS/functions, authentication, device API
**Environment tested:** local Supabase stack only (Docker, Postgres 17). Nothing has been deployed.

## Summary

| ID | Vulnerability | Severity | Status |
|----|---------------|----------|--------|
| V1 | Students could set their own `role` to `admin` | P0 | Fixed, tested |
| V2 | Students could insert their own `active` enrollment (free access) | P0 | Fixed, tested |
| V3 | Any signed-in user could list all usable redeem codes | P0 | Fixed, tested |
| V4 | Lesson `video_url` readable by anyone, including anon | P0 | **Partly fixed** — DB gate done and tested; signed-URL playback route not built yet |
| V5 | Admin policies on `profiles` recursed infinitely | P0 | Fixed, tested |
| V6 | No path to create a profile on first sign-in | P0 | Fixed, tested |
| V7 | SQL functions trusted caller-supplied user/admin IDs | P0 | Fixed, tested |
| A1 | Revoked sessions accepted until JWT expiry | High (found during this work) | Fixed, tested |

"Tested" means an automated test exists, passed against the fixed schema, and the original vulnerability was reproduced on the pre-fix schema (V1–V6; V7 see its section).

## Test results (actual output, 2026-11-11, clean `supabase db reset`)

| Suite | Command | Result |
|-------|---------|--------|
| Migrations | `supabase db reset` | All 5 migrations applied to a clean DB |
| pgTAP RLS/security | `scripts/test-db.sh` | **86 assertions, 0 failed** |
| Concurrency | `scripts/test-db-concurrency.sh` | **3/3 ok** |
| TypeScript | `npm run typecheck` | Pass, no errors |
| Lint | `npm run lint` | Pass, no problems |
| Unit | `npm test` | **16/16 passed** |
| Production build | `next build` (inside `npm run test:integration`) | Pass |
| Auth integration (real Next server + local Supabase) | `npm run test:integration` | **16/16 passed** |

**Controls (checking that the tests can actually fail):**
- **Negative control.** I ran the pgTAP suite against the original 3 migrations. `010_profiles_and_roles.sql` fails from assertion 1 onward. The other files can't load at all because the old schema lacks the fixed structure, so they fail too.
- **Mutation check.** I disabled the session-revocation check in `lib/auth.ts`. 3 integration tests failed (revoked session, sign-out, device removal). I then restored the check, and all 16 passed.

### Reproduction on the original schema

Script: `supabase/tests/repro/original_vulnerabilities.sql`. Run as a signed-in student or as anon, against the original 3 migrations.

```
ERROR:  infinite recursion detected in policy for relation "profiles"   ← V5 (with original policies)
V1 student role after self-update: admin                                ← V1
V2 student self-enrolled active: VULNERABLE                             ← V2
V3 student lists codes: SECRET-CODE                                     ← V3
V4 anon reads video_url: https://cdn/secret.mp4                         ← V4
ERROR:  new row violates row-level security policy for table "profiles" ← V6 (callback insert impossible)
ERROR:  Payment not found / Invalid redeem code                         ← V7 (see note)
```

The V1–V4 lines were captured after temporarily dropping the two recursive policies. Without that step, V5 aborts every query on `profiles` first.

---

## V1 — Privilege escalation via `profiles.role`

- **Root cause:** The `UPDATE` policy `auth.uid() = id` allowed any column change, and `authenticated` had table-wide `UPDATE`. RLS can't restrict individual columns.
- **Remediation:**
  - Revoked all table privileges, then granted only `UPDATE (full_name)` on `profiles`.
  - Added the trigger `private.guard_profile_columns`. It rejects role, id, or email changes made by API roles, which protects against future grant mistakes.
  - Role changes now go only through `admin_set_user_role()`: admin-only, audited, and an admin can't change their own role.
  - There's no public admin registration. The first admin must be set server-side (see "Bootstrapping the first admin").
- **Files:** `supabase/migrations/20261111000001_security_remediation.sql` (sections 0, 4, 6, 7)
- **Tests:**
  - `010_profiles_and_roles.sql`: role/email update rejected with 42501, profile insert rejected, `admin_set_user_role` rejected for students, and role unchanged after the denied attempts.
  - Integration: "student cannot escalate…" checks this through PostgREST with a real token.
- **Result:** Pass.

## V2 — Free course enrollment

- **Root cause:** The policy "Users can create their own enrollments" checked only `user_id`, so a student could insert `status='active'` with any expiry.
- **Remediation:**
  - Removed all client write access to `enrollments`, `manual_payments`, `lesson_progress`, and `redeem_code_usages`.
  - Access can be granted only by `approve_manual_payment()` (admin), `redeem_code()` (valid code), or `admin_grant_enrollment()` (admin, with an explicit future expiry and a reason; audited).
  - A check constraint now requires every `active` enrollment to have `expires_at` and `enrolled_at`.
  - `submit_manual_payment()` creates a pending record only. It grants nothing, and only one pending payment per user and course is allowed.
- **Tests:**
  - `020_enrollments_and_payments.sql`: direct inserts rejected, submitting a payment creates no enrollment, a payment can't be approved twice.
  - Integration: self-enrollment rejected via PostgREST, and the full submit → admin approve → playback flow works.
- **Result:** Pass.

## V3 — Redeem code exposure

- **Root cause:** The `SELECT` policy returned every active, unexpired code to any authenticated user, and codes were stored in plaintext.
- **Remediation:**
  - Codes are stored as SHA-256 hashes (`code_hash`) plus a 4-character hint. The plaintext column is gone.
  - Only admins can `SELECT` code metadata, and the `code_hash` column isn't granted to anyone.
  - `admin_create_redeem_codes()` generates 16-character codes (about 79 bits of entropy) with an unbiased CSPRNG, and returns the plaintext once.
  - `redeem_code(p_code)` locks the code row (`FOR UPDATE`) and validates active status, expiry, usage limit, and prior use by this user.
- **Tests:**
  - `030_redeem_codes.sql`: students see 0 codes, anon is denied, even admins can't read the hash, single-use/duplicate/expired/unknown codes are rejected, and denied attempts don't change usage counts.
  - Concurrency: 20 users racing for one single-use code result in exactly 1 redemption.
- **Result:** Pass.
- **Note:** With 79 bits of entropy, brute force isn't practical. The function itself isn't rate-limited (see remaining risks).

## V4 — Video URL exposure

- **Root cause:** `lessons.video_url` sat in a table that anon users can read.
- **Remediation:**
  - Moved the source to `lesson_media.storage_path`, which only admins can access, and dropped `lessons.video_url`.
  - `get_lesson_playback(lesson_id)` returns the path only to an admin, or to a user who has an active, unexpired enrollment **and** whose current auth session is bound to a registered device.
  - The migration creates a private `lesson-videos` bucket (when Storage is installed) with no object policies, so only the server-side secret key can read it.
- **Tests:**
  - `040_video_and_devices.sql`: anon/student can't read `lesson_media`; unenrolled, unregistered-device, and expired users get 42501; an enrolled user on a registered device gets the path.
  - Integration covers the same checks over HTTP.
- **Result:** Database gate passes.
- **Not done:** There's no route yet that turns the path into a short-lived signed URL and plays it. Storage was disabled locally to fit in the 3 GB host, so signed-URL issuance hasn't been tested. **V4 is not fully closed until that route exists and is tested.**

## V5 — Recursive RLS

- **Root cause:** Admin policies on `profiles` ran `EXISTS (SELECT … FROM profiles …)`, which re-entered the same policies.
- **Remediation:**
  - Added `private.is_admin()`: `SECURITY DEFINER`, owned by the table owner (so RLS is bypassed and there's no recursion), with `search_path=''` and execute granted only to `authenticated`. It lives in the `private` schema, which the Data API doesn't expose.
  - All admin policies now call `(select private.is_admin())`.
- **Tests:** `010`: the admin query on profiles runs and returns all rows. Integration: an admin opens `/admin`.
- **Result:** Pass.

## V6 — Profile creation

- **Root cause:** There was no `INSERT` policy on `profiles`, so the OAuth callback's insert always failed and new users looked signed out.
- **Remediation:**
  - The trigger `on_auth_user_created` → `private.handle_new_auth_user()` (SECURITY DEFINER) inserts the profile with role **always `student`**. User metadata is used only for the display name.
  - A backfill covers any existing users.
  - The callback no longer writes to `profiles`.
- **Tests:**
  - `010`: first login creates one student profile, a `role: admin` value in metadata is ignored, and a returning login doesn't duplicate the profile.
  - Integration: the same checks via GoTrue's admin API.
- **Result:** Pass.

## V7 — Unsafe SQL functions

- **Root cause:**
  - `redeem_code(code, user_id)` and `approve_manual_payment(payment, admin_id, …)` took the identity as arguments.
  - `log_admin_action` let callers set `admin_id`.
  - No function pinned `search_path`, and `EXECUTE` was granted to `PUBLIC` by default.
- **Correction to my earlier report:** In the original schema these functions were `SECURITY INVOKER`, so RLS blocked the student attacks I described ("Payment not found" and "Invalid redeem code" in the reproduction above). The real defects:
  - An admin could record any user as `reviewed_by` or forge `admin_audit_logs.admin_id`.
  - The functions didn't work for their intended purpose at all.
  - The obvious way to make them work (adding `SECURITY DEFINER`) would have made them directly exploitable.
- **Remediation:**
  - Every function derives identity from `auth.uid()`; no function takes a user-ID or admin-ID argument for the caller.
  - Every `SECURITY DEFINER` function sets `search_path = ''`.
  - Default `EXECUTE` is revoked from `PUBLIC`, `anon`, and `authenticated` (including default privileges for future functions), and only the 13 intended API functions are granted.
  - Maintenance functions are executable by `service_role` only.
  - Admins can't approve their own payments.
- **Tests:**
  - `020` and `030`: the old two-argument `redeem_code` is gone, redemption is recorded for the caller, and anon/other students can't approve a payment.
  - `040`: a catalogue check that every SECURITY DEFINER function pins `search_path`.
  - Concurrency: 4 parallel approvals of one payment result in exactly 1 approval.
- **Result:** Pass.

## A1 — Revoked sessions still accepted (found during this work)

- **Root cause:** `getClaims()` only verifies the JWT signature. After sign-out or device removal, the cookie's JWT stayed valid for up to 1 hour.
- **Remediation:** `public.current_session_is_active()` checks `auth.sessions`, and `getCurrentUser()` calls it on every authenticated server request.
- **Files:**
  - `supabase/migrations/20261111000002_session_validation.sql`
  - `lib/auth.ts`
- **Tests:**
  - `050_session_validation.sql` (3 assertions).
  - Integration tests for revoked session, sign-out, and device removal. These 3 fail when the check is disabled (mutation check above).
- **Result:** Pass.

---

## Other changes

**Phase 3 — invented business rules removed:**
- Dropped the `access_duration_days DEFAULT 365`. Price, currency, and duration are now nullable, validated (price ≥ 0, ISO-4217 currency, duration > 0), and **required before a course can be published** (check constraint).
- Removed the hardcoded `$`. Prices render with the admin-configured currency code, and show "Price to be announced" when not set.
- No prices, promotions, or access terms exist in code or seed data. The `1000 MMK / 30 days` values appear only in test fixtures.

**Phase 4 — authentication:**
- `middleware.ts` became `proxy.ts` (Next 16).
- Open-redirect-safe `next` parameter.
- POST-only sign-out.
- `/login` page with error states.
- Server-side admin guard on `/admin`.
- Device registration after sign-in, with a device-limit page.
- `DELETE /api/devices/[id]` with these checks: auth, origin, UUID validation, ownership, session revocation, and a 5-removals-per-hour limit.
- Email sign-in disabled in the local config.

**Runtime:** The installed `@supabase/supabase-js` crashes on Node 20 (missing WebSocket), so I upgraded the host to Node 22 and set `engines.node >= 22` and `.nvmrc`.

## Files changed

**Database:**
- `supabase/migrations/20261111000001_security_remediation.sql`
- `supabase/migrations/20261111000002_session_validation.sql`
- `supabase/config.toml`

**Database tests:**
- `supabase/tests/database/*.sql`
- `scripts/test-db.sh`
- `scripts/test-db-concurrency.sh`

**App:**
- `lib/auth.ts`, `lib/env.ts`, `lib/env.server.ts`, `lib/routes.ts`, `lib/format.ts`, `lib/device.ts`, `lib/db-helpers.ts`, `lib/database.types.ts`
- `lib/supabase/*`
- `proxy.ts`
- `app/auth/{callback,device,signout}/route.ts`
- `app/api/devices/[deviceId]/route.ts`
- `app/{login,device-limit,admin,my-courses,profile}/page.tsx`
- `app/page.tsx`
- `components/*`

**App tests:**
- `tests/unit/*`
- `tests/integration/*`
- `vitest.config.mts`
- `scripts/test-integration.sh`

## Remaining risks and gaps (not verified, or not done)

1. **Real Google OAuth has not been tested.** It needs Google Cloud credentials. Integration tests mint sessions through GoTrue's admin API, which produces the same session and cookie shape but doesn't exercise Google's redirect or consent. See `SETUP_GOOGLE_OAUTH.md`.
2. **V4 signed-URL playback isn't implemented** (see above).
3. **Device limit is a soft control.** A user who copies both their session and device cookies to another machine can share access. Device keys are httpOnly cookies; no hardware binding is possible in a browser.
4. **Rate limiting covers device removal only.** Redeem attempts, payment submissions, and auth endpoints have no app-level throttle. Supabase Auth has its own limits; add edge/WAF rate limiting before launch.
5. **Payment proof upload isn't implemented.** `submit_manual_payment` only requires the proof path to sit under the caller's own folder. Admins must check `amount` against `expected_amount` by hand; nothing enforces that they match.
6. **No security headers or CSP yet.**
7. **`npm audit` reports 8 moderate advisories (not reviewed).**
8. **Hosted Supabase settings must mirror the local config:** email provider disabled, Google enabled, redirect URLs restricted. This can't be verified until the project exists.
9. **The original vulnerable migrations stay in history and run first on a new database.** That's harmless (the remediation runs immediately after), but they could be squashed before the first production deploy.
10. **Admin tools are not built yet.** Only the database functions exist.

## Bootstrapping the first admin

There's no admin sign-up. After that person signs in with Google once, run this using the service role or SQL editor, not the app:

```sql
update public.profiles set role = 'admin' where email = '<admin email>';
```

## How to reproduce

```bash
supabase start -x vector,logflare,imgproxy,studio,mailpit,edge-runtime,realtime,storage-api,supavisor,postgres-meta
supabase db reset
npm run test:db && npm run typecheck && npm run lint && npm test && npm run test:integration
```
