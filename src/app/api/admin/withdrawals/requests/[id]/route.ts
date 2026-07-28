import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  const withdrawalRef = adminDb.collection('withdrawals').doc(id);
  const snap = await withdrawalRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  const withdrawal = snap.data()!;
  if (withdrawal.status !== 'pending') return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 });

  const userRef = adminDb.collection('users').doc(withdrawal.uid);
  const batch = adminDb.batch();

  if (action === 'approve') {
    // The wallet amount was already debited when the request was made — the
    // payout itself happens externally (bank transfer using payoutMethod),
    // so approving here just marks it settled.
    batch.set(withdrawalRef, { status: 'paid' }, { merge: true });
  } else {
    // Reversing a rejected withdrawal: refund the wallet and record it as a
    // credit so it shows up in the user's activity feed.
    batch.set(withdrawalRef, { status: 'failed' }, { merge: true });
    batch.set(userRef, { walletAmount: FieldValue.increment(withdrawal.amount) }, { merge: true });
    batch.set(userRef.collection('walletTransactions').doc(), {
      txnType: 'credit',
      txnName: 'Withdrawal reversed',
      amount: withdrawal.amount,
      txnRef: withdrawal.reference,
      timestamp: FieldValue.serverTimestamp()
    });
  }

  await batch.commit();

  return NextResponse.json({ ok: true });
}
