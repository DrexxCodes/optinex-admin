import { supabaseAdmin } from '@/lib/supabase/admin';
import { UUID_RE } from '@/lib/db/format';
import { redis, gameLeaderboardKey, gameLeaderboardNamesKey, CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

// Wipes one game's leaderboard (sorted set + username cache) and zeroes that game's high score on
// every player who had one (`profiles.casino_high_scores` is a jsonb map of `{ [gameId]: score }`).
export async function resetLeaderboard(gameId: CasinoGameId): Promise<{ clearedCount: number }> {
  const leaderboardKey = gameLeaderboardKey(gameId);
  const namesKey = gameLeaderboardNamesKey(gameId);

  const uids = await redis.zrange<string[]>(leaderboardKey, 0, -1);

  await Promise.all([redis.del(leaderboardKey), redis.del(namesKey)]);

  const ids = uids.map(String).filter((id) => UUID_RE.test(id));
  if (ids.length) {
    const { error } = await supabaseAdmin.rpc('reset_game_scores', { p_game: gameId, p_ids: ids });
    if (error) throw new Error(error.message);
  }

  return { clearedCount: uids.length };
}

// Wipes every game's leaderboard. Returns the total scores cleared across all games.
export async function resetAllLeaderboards(): Promise<{ clearedCount: number }> {
  let total = 0;
  for (const gameId of CASINO_GAME_IDS) {
    const { clearedCount } = await resetLeaderboard(gameId);
    total += clearedCount;
  }
  return { clearedCount: total };
}
