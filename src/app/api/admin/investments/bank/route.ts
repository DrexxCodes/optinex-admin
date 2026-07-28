import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('config').doc('bank').get();
  return NextResponse.json(snap.exists ? snap.data() : { bankName: '', accountNumber: '', accountName: '' });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { bankName, accountNumber, accountName } = await req.json();
  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: 'Bank name, account number, and account name are all required.' }, { status: 400 });
  }

  await adminDb.collection('config').doc('bank').set({ bankName, accountNumber, accountName }, { merge: true });
  return NextResponse.json({ ok: true });
}
