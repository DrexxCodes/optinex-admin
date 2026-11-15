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
