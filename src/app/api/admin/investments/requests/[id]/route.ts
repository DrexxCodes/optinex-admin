import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  const invRef = adminDb.collection('investments').doc(id);
  const snap = await invRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  const investment = snap.data()!;
  if (investment.status !== 'pending') return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 });

  const userRef = adminDb.collection('users').doc(investment.uid);
  const batch = adminDb.batch();

  if (action === 'approve') {
    batch.set(invRef, { status: 'active' }, { merge: true });
    batch.set(userRef, { packageStatus: investment.packageName, packageId: investment.packageId }, { merge: true });
  } else {
    batch.set(invRef, { status: 'failed' }, { merge: true });
    batch.set(userRef, { packageStatus: 'Free' }, { merge: true });
  }

  await batch.commit();

  if (action === 'approve') await logAnalyticsEvent('investment_verified', investment.amount ?? 0);

  return NextResponse.json({ ok: true });
}
