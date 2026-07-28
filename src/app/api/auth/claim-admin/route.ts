import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);
  const snap = await userRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const alreadyAdmin = snap.data()?.admin === true;
  if (!alreadyAdmin) await userRef.set({ admin: true }, { merge: true });

  return NextResponse.json({ ok: true, fullName: snap.data()?.fullName ?? '', wasAlreadyAdmin: alreadyAdmin });
}
