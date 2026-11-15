import { supabaseAdmin } from '@/lib/supabase/admin';
import { getConfig, mergeConfig } from '@/lib/db/config';
import { UUID_RE } from '@/lib/db/format';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// ₦ credited per successful referral, for the admin Referrals leaderboard only. Independent of the
// real wallet bonus paid at signup time (currently ₦2,000 — see Incossify-user's `/api/auth/signup`
// route) — this is the flat rate the leaderboard uses to turn a referral count into a naira figure.
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

// Ranked by this week's referrals, read live from the Redis weekly sorted set (the same Upstash
// instance/keys the user app's own leaderboard reads — see src/lib/redis.ts). All-time counts come
// from the separate, never-reset REFERRAL_LEADERBOARD_KEY zset the user app already maintains.
//
// The `weekly_referrals` / `all_time_referrals` columns on `profiles` remain the source of truth —
// Redis here is purely a read cache. Only uids who referred at least once since the last weekly
// reset appear: that's the correct read for a *weekly* competition board.
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

  // The Redis name cache is best-effort, so anything missing there falls back to the database (the
  // real source of truth for a user's name) in ONE query, and backfills the cache for next time.
  const missingUids = uids.filter((uid) => {
    const cached = names?.[uid];
    if (!cached) return true;
    try {
      return !JSON.parse(cached as string).fullName;
    } catch {
      return true;
    }
  });

  const fetchedNames = new Map<string, { fullName: string; username: string }>();
  const lookupIds = missingUids.filter((id) => UUID_RE.test(id));
  if (lookupIds.length > 0) {
    const { data } = await supabaseAdmin.from('profiles').select('id, full_name, username').in('id', lookupIds);
    for (const r of data ?? []) {
      fetchedNames.set(r.id, { fullName: r.full_name || 'Incossify user', username: r.username ?? '' });
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
    const cached = names?.[entry.member];
    if (cached) {
      try {
        const parsed = JSON.parse(cached as string);
        if (parsed.fullName) {
          fullName = parsed.fullName;
          username = parsed.username ?? username;
        }
      } catch {
        // ignore malformed cache entries, fall through to the database lookup above
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

// Kept in its own `referralWeekly` config row rather than the shared `resetLog` row used by the
// (separate, more destructive) "Reset Stats" page.
export async function getReferralWeeklyResetLog(): Promise<string | null> {
  const value = await getConfig<{ lastReset?: string }>('referralWeekly');
  return value?.lastReset ? new Date(value.lastReset).toISOString() : null;
}

// Zeroes every user's *weekly* referral count only. Never touches `all_time_referrals`,
// `referral_earnings`, or `wallet_amount` — those persist forever, exactly as required.
export async function resetWeeklyReferrals(): Promise<{ cleared: number }> {
  const { data, error } = await supabaseAdmin.rpc('reset_weekly_referrals');
  if (error) throw new Error(error.message);

  // The Redis zset is what getReferralLeaderboard() actually reads — clearing it is what makes the
  // board show zero immediately. The database zeroing keeps the per-user column in sync with it.
  await redis.del(REFERRAL_WEEKLY_LEADERBOARD_KEY);

  await mergeConfig('referralWeekly', { lastReset: new Date().toISOString() });

  return { cleared: Number(data ?? 0) };
}
