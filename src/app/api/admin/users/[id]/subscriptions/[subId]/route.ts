import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { newestActivePackageDoc } from '@/lib/userSubscriptions';

class RevokeError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// Revokes an ACTIVE package investment or account upgrade.
//   body: { kind: 'package' | 'upgrade' }
//
// The doc is kept (status -> 'revoked', with who/when) so it stays in the
// user's history and the audit trail. The profile is only touched when the
// revoked doc is what's actually live on it:
//   - package: reset to Free only if this is the user's current package. An
//     older, already-replaced package is just marked revoked.
//   - upgrade: back to a standard account unless another active upgrade doc
//     still backs the tier.
// Runs in a transaction so the "is it live?" check and the write can't be
// split by a concurrent approval.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id, subId } = await params;
  const { kind } = await req.json();
  if (kind !== 'package' && kind !== 'upgrade') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const collectionName = kind === 'package' ? 'investments' : 'accountUpgrades';
  const userRef = adminDb.collection('users').doc(id);
  const subRef = adminDb.collection(collectionName).doc(subId);
  const activeQuery = adminDb.collection(collectionName).where('uid', '==', id).where('status', '==', 'active');

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const [userSnap, subSnap, activeSnap] = await Promise.all([tx.get(userRef), tx.get(subRef), tx.get(activeQuery)]);

      if (!userSnap.exists) throw new RevokeError('User not found.', 404);
      const sub = subSnap.data();
      // The uid check stops an admin (or a stale UI) from revoking a doc that
      // belongs to someone else via a mismatched URL.
      if (!subSnap.exists || !sub || sub.uid !== id) throw new RevokeError('Subscription not found.', 404);
      if (sub.status !== 'active') throw new RevokeError('Only active subscriptions can be revoked.', 400);

      const user = userSnap.data()!;
      const revoked = { status: 'revoked', revokedAt: FieldValue.serverTimestamp(), revokedBy: admin.uid };

      if (kind === 'package') {
        const live = user.packageId ? newestActivePackageDoc(activeSnap.docs, user.packageId) : null;
        const wasCurrent = user.packageId === sub.packageId && live?.id === subSnap.id;

        tx.set(subRef, revoked, { merge: true });
        if (wasCurrent) {
          tx.set(
            userRef,
            {
              packageStatus: 'Free',
              packageId: FieldValue.delete(),
              packageName: FieldValue.delete(),
              packageStartedAt: FieldValue.delete(),
              packageExpiresAt: FieldValue.delete()
            },
            { merge: true }
          );
        }
        return { packageStatus: wasCurrent ? 'Free' : (user.packageStatus ?? 'Free') };
      }

      const stillUpgraded = activeSnap.docs.some((d) => d.id !== subSnap.id);
      tx.set(subRef, revoked, { merge: true });
      if (!stillUpgraded) tx.set(userRef, { accountTier: 'standard', upgradeStatus: 'none' }, { merge: true });
      return { accountTier: stillUpgraded ? 'upgraded' : 'standard' };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof RevokeError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
