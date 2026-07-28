import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('packages').orderBy('price', 'asc').get();
  return NextResponse.json({
    packages: snap.docs.map((d) => {
      const p = d.data();
      return { id: d.id, name: p.name, price: p.price, duration: p.duration, details: p.details ?? [], active: p.active !== false };
    })
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { name, price, duration, details } = await req.json();
  if (!name || !price || price <= 0 || !duration) {
    return NextResponse.json({ error: 'Name, price, and duration are required.' }, { status: 400 });
  }

  const ref = adminDb.collection('packages').doc();
  await ref.set({
    name,
    price,
    duration,
    details: Array.isArray(details) ? details.filter(Boolean) : [],
    active: true,
    createdAt: FieldValue.serverTimestamp()
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
