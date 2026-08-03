import { adminDb } from '@/lib/firebase/admin';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// Resets referral stats for every user: clears the `referredBy` link (so
// nobody shows up as "referred" anymore, zeroing everyone's connection
// count), zeroes `referralEarnings`, and wipes the Redis referral
// leaderboard. Deliberately does NOT touch `walletAmount` — referral bonuses
// already paid into a user's wallet are real money that has already moved;
// this resets the *stats*, not past payouts.
export async function resetReferralStats(): Promise<{ clearedLinks: number; clearedEarnings: number }> {
  const usersRef = adminDb.collection('users');

  const [referredSnap, earnersSnap] = await Promise.all([
    usersRef.where('referredBy', '!=', null).get(),
    usersRef.where('referralEarnings', '>', 0).get()
  ]);

  for (let i = 0; i < referredSnap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of referredSnap.docs.slice(i, i + 500)) {
      batch.set(doc.ref, { referredBy: null }, { merge: true });
    }
    await batch.commit();
  }

  for (let i = 0; i < earnersSnap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of earnersSnap.docs.slice(i, i + 500)) {
      batch.set(doc.ref, { referralEarnings: 0 }, { merge: true });
    }
    await batch.commit();
  }

  await Promise.all([redis.del(REFERRAL_LEADERBOARD_KEY), redis.del(REFERRAL_LEADERBOARD_NAMES_KEY)]);

  return { clearedLinks: referredSnap.size, clearedEarnings: earnersSnap.size };
}
