import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  redis,
  CASINO_GAME_IDS,
  gameLeaderboardKey,
  gameLeaderboardNamesKey,
  REFERRAL_LEADERBOARD_KEY,
  REFERRAL_WEEKLY_LEADERBOARD_KEY,
  REFERRAL_LEADERBOARD_NAMES_KEY
} from '@/lib/redis';

export type NukeResult = {
  usersDeleted: number;
  adminsPreserved: number;
  authUsersDeleted: number;
};

// The big red button: deletes every non-admin user (their Supabase Auth account and everything that
// cascades off the profile — wallet history, check-ins, spins, completed tasks, push tokens, loans),
// every investment / withdrawal / upgrade / legacy-transaction record, and every Redis leaderboard
// and referral zset.
//
// Admin accounts (`is_admin = true`) are deliberately kept — there is no password-reset flow in this
// app, so deleting the signed-in admin would permanently lock every admin out. This mirrors the
// self-protection in api/admin/users/[id]/route.ts ("You can't remove your own admin access.").
// The database work is one atomic function (public.nuke_all_users).
export async function nukeAllUsers(): Promise<NukeResult> {
  const { data, error } = await supabaseAdmin.rpc('nuke_all_users');
  if (error) throw new Error(error.message);

  const redisKeys = [
    ...CASINO_GAME_IDS.flatMap((id) => [gameLeaderboardKey(id), gameLeaderboardNamesKey(id)]),
    REFERRAL_LEADERBOARD_KEY,
    REFERRAL_WEEKLY_LEADERBOARD_KEY,
    REFERRAL_LEADERBOARD_NAMES_KEY
  ];
  await Promise.all(redisKeys.map((key) => redis.del(key)));

  return {
    usersDeleted: data?.usersDeleted ?? 0,
    adminsPreserved: data?.adminsPreserved ?? 0,
    authUsersDeleted: data?.authUsersDeleted ?? 0
  };
}
