import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// ₦ credited per successful referral, for the admin Referrals leaderboard
// only. Independent of the real wallet bonus paid at signup time (currently
// ₦2,000 — see Incossify-user's `/api/auth/signup` route) — this is the flat
// rate the leaderboard uses to turn a referral count into a naira figure.
export const REFERRAL_INCOME_RATE = 1000;

export type ReferralLeaderboardEntry = {
  uid: string;
  fullName: string;
  username: string;
  weeklyReferrals: number;
  allTimeReferrals: number;
  weeklyIncome: number;
  allTimeIncome: number;
  rank: number;
};

const LEADERBOARD_LIMIT = 50;

// Upstash's zrange with withScores returns a flat array: [member, score, member, score, ...]
function parseFlatScored(flat: (string | number)[]): { member: string; score: number }[] {
  const out: { member: string; score: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ member: String(flat[i]), score: Number(flat[i + 1]) });
  }
  return out;
}

// Ranked by this week's referrals, read live from the Redis weekly sorted set
// (the same Upstash instance/keys the user app's own leaderboard reads —
// see src/lib/redis.ts) instead of a Firestore orderBy scan across every
// user. All-time counts come from the separate, never-reset
// REFERRAL_LEADERBOARD_KEY zset the user app already maintains.
//
// Firestore's `weeklyReferrals`/`allTimeReferrals` fields (written by
// Incossify-user's signup route) remain the source of truth — Redis here is
// purely a read cache, same tradeoff already accepted for the user-facing
// leaderboard's referral counts and name cache. A dropped Redis write would
// mean this board briefly under-counts someone; it self-corrects on their
// next referral.
//
// One behavioural note vs. the old Firestore-orderBy version: only uids who
// referred at least once since the last weekly reset appear here at all —
// people who referred a lot in past weeks but nothing this week now drop off
// entirely rather than sitting at the bottom with 0. That's the correct read
// for a *weekly* competition board.
export async function getReferralLeaderboard(): Promise<ReferralLeaderboardEntry[]> {
  const raw = await redis.zrange(REFERRAL_WEEKLY_LEADERBOARD_KEY, 0, LEADERBOARD_LIMIT - 1, {
    rev: true,
    withScores: true
  });
  const top = parseFlatScored(raw as (string | number)[]);
  if (top.length === 0) return [];

  const uids = top.map((t) => t.member);

  const [names, allTimeScores] = await Promise.all([
    redis.hmget<Record<string, string>>(REFERRAL_LEADERBOARD_NAMES_KEY, ...uids),
    Promise.all(uids.map((uid) => redis.zscore(REFERRAL_LEADERBOARD_KEY, uid)))
  ]);

  // Same self-healing fallback as the user-facing leaderboard: the Redis name
  // cache is best-effort (written at signup, only going back to when caching
  // was added), so anything missing there falls back to Firestore — the real
  // source of truth for a user's name — and backfills the cache for next time.
  const missingUids = uids.filter((uid) => {
    const cached = names?.[uid];
    if (!cached) return true;
    try {
      const parsed = JSON.parse(cached as string);
      return !parsed.fullName;
    } catch {
      return true;
    }
  });

  const fetchedNames = new Map<string, { fullName: string; username: string }>();
  if (missingUids.length > 0) {
    const snaps = await Promise.all(missingUids.map((uid) => adminDb.collection('users').doc(uid).get()));
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const d = snap.data()!;
      fetchedNames.set(snap.id, { fullName: d.fullName ?? 'Incossify user', username: d.username ?? '' });
    }
    if (fetchedNames.size > 0) {
      try {
        const hsetPayload: Record<string, string> = {};
        for (const [uid, entry] of fetchedNames) hsetPayload[uid] = JSON.stringify(entry);
        await redis.hset(REFERRAL_LEADERBOARD_NAMES_KEY, hsetPayload);
      } catch (err) {
        console.error('[admin/referrals] name cache backfill failed:', err);
      }
    }
  }

  return top.map((entry, i) => {
    let fullName = 'Incossify user';
    let username = '';
    const raw = names?.[entry.member];
    if (raw) {
      try {
        const parsed = JSON.parse(raw as string);
        if (parsed.fullName) {
          fullName = parsed.fullName;
          username = parsed.username ?? username;
        }
      } catch {
        // ignore malformed cache entries, fall through to the Firestore lookup above
      }
    }
    const fetched = fetchedNames.get(entry.member);
    if (fetched) {
      fullName = fetched.fullName;
      username = fetched.username;
    }

    const weeklyReferrals = entry.score;
    const allTimeReferrals = Number(allTimeScores[i] ?? 0);

    return {
      uid: entry.member,
      fullName,
      username,
      weeklyReferrals,
      allTimeReferrals,
      weeklyIncome: weeklyReferrals * REFERRAL_INCOME_RATE,
      allTimeIncome: allTimeReferrals * REFERRAL_INCOME_RATE,
      rank: i + 1
    };
  });
}

// Kept in its own `system/referralWeekly` doc rather than the shared
// `system/resetLog` doc used by the (separate, more destructive) "Reset
// Stats" page — this is a lighter, purely-weekly action and shouldn't be
// tangled up with that page's full-wipe referral reset.
const referralWeeklyLogRef = adminDb.collection('system').doc('referralWeekly');

export async function getReferralWeeklyResetLog(): Promise<string | null> {
  const snap = await referralWeeklyLogRef.get();
  const ts = snap.data()?.lastReset as { toDate?: () => Date } | undefined;
  return ts?.toDate?.()?.toISOString?.() ?? null;
}

// Zeroes every user's *weekly* referral count only. Never touches
// `allTimeReferrals`, `referralEarnings`, or `walletAmount` — those persist
// forever, exactly as required.
export async function resetWeeklyReferrals(): Promise<{ cleared: number }> {
  const snap = await adminDb.collection('users').where('weeklyReferrals', '>', 0).get();

  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of snap.docs.slice(i, i + 500)) {
      batch.set(doc.ref, { weeklyReferrals: 0 }, { merge: true });
    }
    await batch.commit();
  }

  // The Redis zset is what getReferralLeaderboard() actually reads — clearing
  // it is what makes the board show zero immediately. The Firestore zeroing
  // above keeps the per-user field (source of truth) in sync with it.
  await redis.del(REFERRAL_WEEKLY_LEADERBOARD_KEY);

  await referralWeeklyLogRef.set({ lastReset: FieldValue.serverTimestamp() }, { merge: true });

  return { cleared: snap.size };
}
