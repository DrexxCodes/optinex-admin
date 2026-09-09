import { getAuth } from 'firebase-admin/auth';
import type { QueryDocumentSnapshot, DocumentReference } from 'firebase-admin/firestore';
import { adminDb, adminApp } from '@/lib/firebase/admin';
import {
  redis,
  CASINO_GAME_IDS,
  gameLeaderboardKey,
  gameLeaderboardNamesKey,
  REFERRAL_LEADERBOARD_KEY,
  REFERRAL_WEEKLY_LEADERBOARD_KEY,
  REFERRAL_LEADERBOARD_NAMES_KEY
} from '@/lib/redis';

// Every subcollection a user doc can own — see Incossify-user's api/streak/*,
// api/tasks/*, api/auth/signin & Incossify-admin's api/admin/users/[id]/wallet.
// Keep this in sync by hand if a new per-user subcollection is ever added.
const USER_SUBCOLLECTIONS = ['walletTransactions', 'completedTasks', 'checkins', 'spins', 'refreshTokens'] as const;

// Top-level collections that only ever hold records *about* a user (each doc
// carries a `uid` field back to `users`) — deleting them alongside `users`
// is what makes this a real "clear everyone" rather than a half-wipe that
// leaves orphaned investment/withdrawal/transaction history lying around.
// Deliberately excludes `packages`, `tasks`, `config`, `system`: those are
// admin-authored app configuration, not user data.
const USER_OWNED_COLLECTIONS = ['accountUpgrades', 'investments', 'withdrawals', 'transactions'] as const;

async function deleteInBatches(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 500) {
    const batch = adminDb.batch();
    for (const ref of refs.slice(i, i + 500)) batch.delete(ref);
    await batch.commit();
  }
}

async function deleteCollection(path: string) {
  // Chunked so this never tries to hold an unbounded collection in memory
  // or exceed Firestore's 500-writes-per-batch limit.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await adminDb.collection(path).limit(500).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
  }
}

async function deleteUserSubcollections(userDoc: QueryDocumentSnapshot) {
  for (const name of USER_SUBCOLLECTIONS) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const snap = await userDoc.ref.collection(name).limit(500).get();
      if (snap.empty) break;
      await deleteInBatches(snap.docs.map((d) => d.ref));
    }
  }
}

// Best-effort: Firebase Auth is currently only wired up for a future Google
// sign-in (see Incossify-admin's lib/firebase/client.ts) — real login is the
// app's own bcrypt+JWT system against the `users` collection, so this is
// very likely a no-op today. Still nuked because it was asked for and
// because any account that *does* exist there should go too. Wrapped so a
// missing Auth setup can't fail the rest of the wipe.
async function nukeFirebaseAuthUsers(): Promise<number> {
  try {
    const auth = getAuth(adminApp);
    let deleted = 0;
    let pageToken: string | undefined;
    do {
      const page = await auth.listUsers(1000, pageToken);
      if (page.users.length) {
        const uids = page.users.map((u) => u.uid);
        for (let i = 0; i < uids.length; i += 1000) {
          const res = await auth.deleteUsers(uids.slice(i, i + 1000));
          deleted += res.successCount;
        }
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return deleted;
  } catch (err) {
    console.error('[resetUsers] Firebase Auth wipe skipped:', err);
    return 0;
  }
}

export type NukeResult = {
  usersDeleted: number;
  adminsPreserved: number;
  authUsersDeleted: number;
};

// The big red button: deletes every non-admin user (and everything hanging
// off them), every investment/withdrawal/upgrade/transaction record, every
// Redis leaderboard and referral zset, and every Firebase Auth account.
//
// Admin accounts (`admin === true` on the users doc) are deliberately kept —
// there is no password-reset flow in this app, so deleting the signed-in
// admin's own doc would permanently lock every admin out with no recovery
// path. This mirrors the existing self-protection in
// api/admin/users/[id]/route.ts ("You can't remove your own admin access.").
export async function nukeAllUsers(): Promise<NukeResult> {
  const usersSnap = await adminDb.collection('users').get();
  const toDelete = usersSnap.docs.filter((d) => d.data().admin !== true);
  const adminsPreserved = usersSnap.size - toDelete.length;

  // Subcollections first — Firestore never cascade-deletes them, and a
  // batch-deleted parent would otherwise leave them dangling forever.
  for (const userDoc of toDelete) {
    await deleteUserSubcollections(userDoc);
  }
  await deleteInBatches(toDelete.map((d) => d.ref));

  for (const collectionName of USER_OWNED_COLLECTIONS) {
    await deleteCollection(collectionName);
  }

  const redisKeys = [
    ...CASINO_GAME_IDS.flatMap((id) => [gameLeaderboardKey(id), gameLeaderboardNamesKey(id)]),
    REFERRAL_LEADERBOARD_KEY,
    REFERRAL_WEEKLY_LEADERBOARD_KEY,
    REFERRAL_LEADERBOARD_NAMES_KEY
  ];
  await Promise.all(redisKeys.map((key) => redis.del(key)));

  const authUsersDeleted = await nukeFirebaseAuthUsers();

  return { usersDeleted: toDelete.length, adminsPreserved, authUsersDeleted };
}
