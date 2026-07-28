import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

// Looks a single user up by exact email — a single indexed-equality query
// instead of pulling a page of users and filtering client-side. Cheap at
// any scale since it's always at most one document read.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Provide an email to search for.' }, { status: 400 });

  const snap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: 'No user found with that email.' }, { status: 404 });

  const doc = snap.docs[0];
  const u = doc.data();

  return NextResponse.json({
    user: {
      uid: doc.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      walletAmount: u.walletAmount ?? 0,
      packageStatus: u.packageStatus ?? 'Free',
      accountTier: u.accountTier ?? 'standard',
      admin: u.admin === true,
      createdAt: u.createdAt?.toDate?.()?.toISOString?.() ?? null
    }
  });
}
