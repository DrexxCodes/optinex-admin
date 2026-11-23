# Changelog — API extracted to optinex-backend (admin app)

## What changed
- **No database or service code left in this app.** All 44 route handlers under `src/app/api/**` (`/api/admin/*` and `/api/auth/*`) were ported to the Fastify service `optinex-backend` at the same URLs. `next.config.js` rewrites `/api/auth/*` and `/api/admin/*` to `BACKEND_URL` (nothing else is forwarded), so every existing `authFetch('/api/admin/...')` call works unchanged and cookies stay same-origin.
- **Server Components ask the backend who you are.** `src/app/admin/layout.tsx` and `src/app/page.tsx` used to read the Supabase session and query `profiles.is_admin` directly; they now call `getServerSession()` (`src/lib/auth/session.ts`), which forwards the httpOnly cookies to `GET /api/auth/session` and gets `{ uid, email, admin }` back in one round trip (previously two). Redirect behaviour is unchanged (`/login` → no session, `/welcome` → not admin).
- **`src/proxy.ts`** now uses `src/lib/auth/proxySession.ts` (replaces `src/lib/supabase/proxy.ts`): if the access cookie lapsed it asks the backend to rotate it and re-issues the cookies; dead refresh token clears them; a backend outage keeps the session. Same code as the user app.
- **Admin API authorization is stricter in one place:** an expired/missing session on `/api/admin/*` now returns **401** (was 403) so `authFetch`'s silent refresh-and-retry actually kicks in; signed-in non-admins still get **403**. The `is_admin` flag is still checked live on every request, now in one place (a single backend hook) instead of per route.
- `src/lib/casino.ts` (new): the casino game-id type/list the leaderboard UI needs, previously imported from the Redis module (4 imports updated).

## Removed
- `src/app/api/**`, `src/lib/supabase/**`, `src/lib/db/**`, `src/lib/firebase/**`, `src/lib/redis.ts`, `src/lib/analytics.ts`, `src/lib/refGenerator.ts`, `src/lib/referralWeekly.ts`, `src/lib/reset{Analytics,Leaderboard,Log,Referral,Users,Withdrawals}.ts`, `src/lib/auth/adminGuard.ts` — all of this now lives in `optinex-backend`.
- Dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `@upstash/redis`, `firebase-admin`, `@dicebear/core`, `@dicebear/collection`.
- Env: only `BACKEND_URL` remains (see `.env.example`). The previous `.env.example` also contained a real Supabase project URL and key — these are no longer needed here.

## Verified
`tsc --noEmit` and `next build` pass. Booted against the real backend: admin sign-in, `/` → `/admin` for admins and `/welcome` for non-admins, `/admin` guarded for anonymous and non-admin visitors, `/api/admin/*` works for admins and returns 403 for non-admins, user API is not reachable through the admin domain.

---

# Changelog — Firebase → Supabase migration (admin app)

## What changed
- All `/api/admin/*` routes now read/write Supabase Postgres (service-role client in `src/lib/supabase/admin.ts`).
- Auth is Supabase Auth: `/api/auth/signin` signs in server-side and sets the session cookies; `proxy.ts` refreshes expired sessions; `getSessionUser()` has the same shape as before.
- **Dashboard overview is a single Postgres call** (`admin_overview`) instead of many count queries + per-package scans.
- Approve/reject for investments, upgrades and withdrawals, subscription revoke, loan stage moves and every reset are now atomic Postgres functions.
- Pending-request lists join the user's name in one query (no per-row user lookups).
- Redis leaderboards unchanged; push still sent via FCM, history stored in `push_notifications`.

## Security fixes (behaviour changes you should know about)
1. **Admin self-promotion removed.** `/api/auth/claim-admin` used to flip `admin: true` for *any* signed-in account. It now only confirms an existing admin (403 otherwise; `/welcome` shows an "no admin access" message). Admins are set by `profiles.is_admin` (migrated from the old `admin` field) or by an existing admin on the Users page.
2. **`/api/admin/reset/nuke` was unauthenticated** (it created a 403 but never returned it and never called `requireAdmin`). Anyone who knew the phrase could delete every user. Fixed: `requireAdmin()` is enforced.
3. Nuking users now deletes Auth accounts via one DB function and, via cascades, also removes those users' loans (previously orphaned).

## Files touched
Added: `src/lib/supabase/*`, `src/lib/db/*`, `.env.example`
Rewritten: `src/proxy.ts`, `src/lib/auth/{session,adminGuard}.ts`, `src/lib/{analytics,referralWeekly,resetAnalytics,resetLeaderboard,resetLog,resetReferral,resetUsers,resetWithdrawals}.ts`, `src/lib/loans/config.ts`, `src/lib/firebase/admin.ts`, `src/app/page.tsx`, `src/app/admin/layout.tsx`, `src/app/welcome/page.tsx` (adds the no-access message), all `src/app/api/auth/*` and `src/app/api/admin/*` routes that used Firestore, `package.json`
Deleted: `src/lib/auth/jwt.ts`, `src/lib/firebase/client.ts`, `src/lib/userSubscriptions.ts` (logic moved into SQL)
