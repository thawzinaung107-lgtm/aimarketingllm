<!--
Proposed replacement for Linear issue ALA-42. Not yet posted: the update was
blocked by the Claude Code permission system and needs the owner's go-ahead.
Title: AI Marketing LMS — Security remediation & test report (corrected; not production-ready)
Project: AI Marketing LMS — onlinelearning.ccone.app (id 8d9af213-c355-4b68-b450-05945d96d3d5)
Issue id: f9fecac8-dc19-4f8f-988b-c3ad5d41433d
-->
# Security remediation and test report (corrected)

> **Correction:** The earlier version of this issue was wrong. It said "Database Verified" and "Auth 100% Complete". At that point the database had 7 critical (P0) security bugs, sign-in could not work, and there were no automated tests. This version replaces it.

**Date:** 2026-11-11 · **Environment:** local Supabase only (Docker). Nothing has been deployed.

## Status
- **All 7 P0 database vulnerabilities are fixed and pass automated tests.** One caveat: V4 (video URLs) is only partly done. The database check is finished, but the signed-URL playback route isn't built yet.
- **Not production-ready.** The admin dashboard, course pages, video player, and payment-proof upload are not built.
- **The homepage does not match the Figma Option 2 V3 design.** It's a placeholder, because Figma access wasn't available.

## Vulnerabilities

| ID | Issue | Result |
|---|---|---|
| V1 | Students could make themselves admin | Fixed, tests pass |
| V2 | Students could unlock paid courses for free | Fixed, tests pass |
| V3 | Signed-in users could list redeem codes | Fixed (codes now hashed, admin-only), tests pass |
| V4 | Lesson video URLs were public | **Partly fixed:** database check passes; signed-URL route not built |
| V5 | Admin policies crashed (infinite recursion) | Fixed, tests pass |
| V6 | First sign-in couldn't create a profile | Fixed (database trigger, always creates a student), tests pass |
| V7 | Functions trusted caller-supplied user/admin IDs | Fixed, tests pass |
| A1 | Signed-out or revoked sessions kept working for up to 1 hour | Found and fixed during this work, tests pass |

## Test results (actual output)
- Migrations applied cleanly to a fresh local database
- Database security tests (pgTAP): **86 assertions, 0 failed**
- Concurrency tests: **3/3 passed**
  - 20 users racing for one single-use code: exactly 1 succeeded
  - 10 parallel device registrations: capped at 2
  - Concurrent approvals of one payment: applied exactly once
- TypeScript: passed · Lint: passed · Production build: passed
- Unit tests: **16/16 passed**
- Auth integration tests (real Next.js server plus local Supabase): **16/16 passed**
- **Controls:**
  - The same database tests fail against the original schema.
  - Disabling the session-revocation check makes 3 integration tests fail.

## Not verified / remaining risks
1. **Real Google sign-in is untested.** It needs Google Cloud credentials. Tests create equivalent sessions through Supabase's admin API instead.
2. **Signed-URL video playback isn't built** (V4).
3. **Rate limiting only covers device removal.** Code redemption, payment submission, and sign-in have no app-level limit.
4. **No security headers or CSP yet.**
5. **`npm audit` reports 8 moderate issues** that haven't been reviewed.
6. **The hosted Supabase project must be set up like the local one:** email sign-in off, Google on, redirect URLs restricted.
7. **The device limit is a soft control.** Someone who copies their cookies to another machine can share access.

## Invented business rules removed
- The 365-day default access period and the hardcoded `$` sign are gone.
- Price, currency, and access duration must be set by an admin before a course can be published.
- **Waiting on the client for real MMK prices and access terms.**

## Needs owner action
- Google OAuth credentials (setup steps are in `SETUP_GOOGLE_OAUTH.md` in the repo)
- Figma MCP access for the Option 2 V3 design
- Approval before any production deploy or domain setup

Full details: `SECURITY_AUDIT.md` in the repository.
