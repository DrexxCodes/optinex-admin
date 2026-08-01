import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

// Looks a single user up by exact email or exact username — a single
// indexed-equality query instead of pulling a page of users and filtering
// client-side. Cheap at any scale since it's always at most one document read.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('email') ?? searchParams.get('username') ?? searchParams.get('q'))?.trim();
  if (!query) return NextResponse.json({ error: 'Provide an email or username to search for.' }, { status: 400 });

  // An email always contains "@"; anything else is treated as a username.
  const isEmail = query.includes('@');
  const field = isEmail ? 'email' : 'username';
  const value = query.toLowerCase();

  const snap = await adminDb.collection('users').where(field, '==', value).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ error: `No user found with that ${field}.` }, { status: 404 });
  }

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
