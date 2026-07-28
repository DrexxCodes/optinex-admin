import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('investments').where('status', '==', 'pending').get();

  const requests = await Promise.all(
    snap.docs.map(async (d) => {
      const r = d.data();
      const userSnap = await adminDb.collection('users').doc(r.uid).get();
      const user = userSnap.data();
      return {
        id: d.id,
        uid: r.uid,
        fullName: user?.fullName ?? 'Unknown user',
        username: user?.username ?? '',
        packageName: r.packageName,
        amount: r.amount,
        receiptUrl: r.receiptUrl,
        reference: r.reference,
        createdAt: r.createdAt?.toDate?.()?.toISOString?.() ?? null
      };
    })
  );

  requests.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ requests });
}
