import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

// Voids every pending withdrawal request. The wallet was already debited
// when the request was made (see Incossify-user's api/withdrawal/request
// route), so voiding it must refund that amount back — otherwise the money
// just vanishes. Marked 'reset' (not 'failed') so it's distinguishable from
// an admin-rejected request in any future audit.
export async function resetPendingWithdrawals(): Promise<{ clearedCount: number }> {
  const snap = await adminDb.collection('withdrawals').where('status', '==', 'pending').get();

  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = adminDb.batch();
    for (const doc of snap.docs.slice(i, i + 500)) {
      const w = doc.data();
      const userRef = adminDb.collection('users').doc(w.uid);

      batch.set(doc.ref, { status: 'reset' }, { merge: true });
      batch.set(userRef, { walletAmount: FieldValue.increment(w.amount ?? 0) }, { merge: true });
      batch.set(userRef.collection('walletTransactions').doc(), {
        txnType: 'credit',
        txnName: 'Withdrawal reset by admin',
        amount: w.amount ?? 0,
        txnRef: w.reference ?? doc.id,
        timestamp: FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  }

  return { clearedCount: snap.size };
}
