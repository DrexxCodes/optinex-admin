import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAnalyticsEvent } from '@/lib/analytics';

function parseDurationToMs(duration: string): number {
  // Parse formats like "30 days", "3 months", "1 year"
  const match = duration.match(/(\d+)\s*(day|month|year)s?/i);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30 days

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
      return value * 24 * 60 * 60 * 1000;
    case 'month':
      return value * 30 * 24 * 60 * 60 * 1000; // approximate
    case 'year':
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

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

  const packageSnap = await adminDb.collection('packages').doc(investment.packageId).get();
  if (!packageSnap.exists) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
  const pkg = packageSnap.data()!;

  const userRef = adminDb.collection('users').doc(investment.uid);
  const batch = adminDb.batch();

  if (action === 'approve') {
    batch.set(invRef, { status: 'active' }, { merge: true });

    // Calculate expiry date based on package duration
    const durationMs = parseDurationToMs(pkg.duration);
    const expiresAt = Date.now() + durationMs;

    const updateData: Record<string, unknown> = {
      packageStatus: investment.packageName,
      packageId: investment.packageId,
      packageName: investment.packageName,
      packageStartedAt: Date.now(),
      packageExpiresAt: expiresAt,
      isChangingPackage: false
    };

    batch.set(userRef, updateData, { merge: true });
  } else {
    batch.set(invRef, { status: 'failed' }, { merge: true });
    batch.set(userRef, { packageStatus: 'Free', isChangingPackage: false }, { merge: true });
  }

  await batch.commit();

  if (action === 'approve') await logAnalyticsEvent('investment_verified', investment.amount ?? 0);

  return NextResponse.json({ ok: true });
}
