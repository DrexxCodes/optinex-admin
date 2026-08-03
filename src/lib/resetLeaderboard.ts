import { adminDb } from '@/lib/firebase/admin';
import { redis, gameLeaderboardKey, gameLeaderboardNamesKey, CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

// Wipes one game's leaderboard (sorted set + username cache) and zeroes that
// game's high score on every player who had one. `casinoHighScores` is a
// nested map (`{ [gameId]: score }`) on each user doc — written as a real
// nested object, not a dotted-string key, so Firestore's set-merge actually
// nests it instead of creating a literal field named e.g. "casinoHighScores.brick-slasher".
export async function resetLeaderboard(gameId: CasinoGameId): Promise<{ clearedCount: number }> {
  const leaderboardKey = gameLeaderboardKey(gameId);
  const namesKey = gameLeaderboardNamesKey(gameId);

  const uids = await redis.zrange<string[]>(leaderboardKey, 0, -1);

  await Promise.all([redis.del(leaderboardKey), redis.del(namesKey)]);

  if (uids.length) {
    for (let i = 0; i < uids.length; i += 500) {
      const batch = adminDb.batch();
      for (const uid of uids.slice(i, i + 500)) {
        batch.set(adminDb.collection('users').doc(String(uid)), { casinoHighScores: { [gameId]: 0 } }, { merge: true });
      }
      await batch.commit();
    }
  }

  return { clearedCount: uids.length };
}

// Wipes every game's leaderboard. Returns the total scores cleared across all 4.
export async function resetAllLeaderboards(): Promise<{ clearedCount: number }> {
  let total = 0;
  for (const gameId of CASINO_GAME_IDS) {
    const { clearedCount } = await resetLeaderboard(gameId);
    total += clearedCount;
  }
  return { clearedCount: total };
}
