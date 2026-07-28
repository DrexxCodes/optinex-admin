import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { generateReference } from '@/lib/refGenerator';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { amount, note } = await req.json();
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount greater than zero.' }, { status: 400 });
  }

  const userRef = adminDb.collection('users').doc(id);
  const snap = await userRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const txnRef = generateReference();
  const batch = adminDb.batch();

  // Written with the exact same fields the user app's wallet-transactions
  // list expects (txnType, txnName, amount, txnRef, timestamp) so it renders
  // identically in the user's transaction history.
  batch.set(userRef.collection('walletTransactions').doc(), {
    txnType: 'credit',
    txnName: note?.trim() || 'Wallet funded by admin',
    amount,
    timestamp: FieldValue.serverTimestamp(),
    txnRef
  });
  batch.set(userRef, { walletAmount: FieldValue.increment(amount) }, { merge: true });

  await batch.commit();

  const updated = await userRef.get();
  return NextResponse.json({ ok: true, walletAmount: updated.data()?.walletAmount ?? 0, txnRef });
}
