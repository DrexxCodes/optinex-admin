import { adminDb } from '@/lib/firebase/admin';
import { redis, LEADERBOARD_KEY, LEADERBOARD_NAMES_KEY } from '@/lib/redis';

export async function resetLeaderboard(): Promise<{ clearedCount: number }> {
  const uids = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, -1);

  await Promise.all([redis.del(LEADERBOARD_KEY), redis.del(LEADERBOARD_NAMES_KEY)]);

  if (uids.length) {
    for (let i = 0; i < uids.length; i += 500) {
      const batch = adminDb.batch();
      for (const uid of uids.slice(i, i + 500)) {
        batch.set(adminDb.collection('users').doc(String(uid)), { highScore: 0 }, { merge: true });
      }
      await batch.commit();
    }
  }

  return { clearedCount: uids.length };
}
