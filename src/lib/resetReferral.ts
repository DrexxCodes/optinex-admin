import { adminDb } from '@/lib/firebase/admin';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_WEEKLY_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// Resets referral stats for every user: clears the `referredBy` link (so
// nobody shows up as "referred" anymore, zeroing everyone's connection
// count), zeroes `referralEarnings`, `weeklyReferrals`, and `allTimeReferrals`,
// and wipes both Redis referral leaderboards (all-time + weekly) plus the name
// cache. Deliberately does NOT touch `walletAmount` — referral bonuses already
// paid into a user's wallet are real money that has already moved; this
// resets the *stats*, not past payouts.
export async function resetReferralStats(): Promise<{ clearedLinks: number; clearedEarnings: number }> {
  const usersRef = adminDb.collection('users');

  const [referredSnap, earnersSnap, weeklySnap, allTimeSnap] = await Promise.all([
    usersRef.where('referredBy', '!=', null).get(),
    usersRef.where('referralEarnings', '>', 0).get(),
    usersRef.where('weeklyReferrals', '>', 0).get(),
    usersRef.where('allTimeReferrals', '>', 0).get()
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

  for (let i = 0; i < weeklySnap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of weeklySnap.docs.slice(i, i + 500)) {
      batch.set(doc.ref, { weeklyReferrals: 0 }, { merge: true });
    }
    await batch.commit();
  }

  for (let i = 0; i < allTimeSnap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of allTimeSnap.docs.slice(i, i + 500)) {
      batch.set(doc.ref, { allTimeReferrals: 0 }, { merge: true });
    }
    await batch.commit();
  }

  await Promise.all([
    redis.del(REFERRAL_LEADERBOARD_KEY),
    redis.del(REFERRAL_WEEKLY_LEADERBOARD_KEY),
    redis.del(REFERRAL_LEADERBOARD_NAMES_KEY)
  ]);

  return { clearedLinks: referredSnap.size, clearedEarnings: earnersSnap.size };
}
