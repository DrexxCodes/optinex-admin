import { supabaseAdmin } from '@/lib/supabase/admin';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// Resets referral stats for every user: clears the `referred_by` link (so nobody shows up as
// "referred" anymore, zeroing everyone's connection count), zeroes `referral_earnings`,
// `weekly_referrals`, and `all_time_referrals`, and wipes both Redis referral leaderboards
// (all-time + weekly) plus the name cache. Deliberately does NOT touch `wallet_amount` — referral
// bonuses already paid are real money that has already moved; this resets the *stats*, not payouts.
export async function resetReferralStats(): Promise<{ clearedLinks: number; clearedEarnings: number }> {
  const { data, error } = await supabaseAdmin.rpc('reset_referral_stats');
  if (error) throw new Error(error.message);

  await Promise.all([
    redis.del(REFERRAL_LEADERBOARD_KEY),
    redis.del(REFERRAL_WEEKLY_LEADERBOARD_KEY),
    redis.del(REFERRAL_LEADERBOARD_NAMES_KEY)
  ]);

  return { clearedLinks: data?.clearedLinks ?? 0, clearedEarnings: data?.clearedEarnings ?? 0 };
}
