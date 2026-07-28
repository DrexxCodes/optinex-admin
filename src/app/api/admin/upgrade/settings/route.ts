import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('config').doc('upgrade').get();
  return NextResponse.json(snap.exists ? snap.data() : { price: null, bankName: '', accountNumber: '', accountName: '' });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { price, bankName, accountNumber, accountName } = await req.json();
  if (!price || price <= 0) return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: 'Bank name, account number, and account name are all required.' }, { status: 400 });
  }

  await adminDb.collection('config').doc('upgrade').set({ price, bankName, accountNumber, accountName }, { merge: true });
  return NextResponse.json({ ok: true });
}
