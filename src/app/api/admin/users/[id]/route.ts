import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { admin: makeAdmin } = await req.json();
  if (typeof makeAdmin !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  if (id === admin.uid && !makeAdmin) {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  await adminDb.collection('users').doc(id).set({ admin: makeAdmin }, { merge: true });
  return NextResponse.json({ ok: true });
}
