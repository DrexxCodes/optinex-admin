import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('config').doc('withdrawal').get();
  const enabledDate = snap.exists ? snap.data()?.enabledDate?.toDate?.()?.toISOString?.() ?? null : null;
  return NextResponse.json({ enabledDate });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { enabledDate } = await req.json();
  if (!enabledDate) return NextResponse.json({ error: 'Pick a date.' }, { status: 400 });

  await adminDb.collection('config').doc('withdrawal').set({ enabledDate: new Date(enabledDate) }, { merge: true });
  return NextResponse.json({ ok: true });
}
