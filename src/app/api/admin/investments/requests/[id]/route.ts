import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAnalyticsEvent } from '@/lib/analytics';

function parseDurationToMs(duration: string): number {
  // The `duration` field on a package is free text (e.g. "30 days", "30",
  // "30d") but the number in it always means days — there's no separate
  // months/years convention in this app. Pull out the first number we find
  // and treat it as a day count, instead of requiring a matching unit word
  // (the old regex silently fell back to a hardcoded 30 days whenever the
  // admin typed the duration without a "day/month/year" suffix, which
  // quietly gave every such package the wrong expiry).
  const match = duration.match(/\d+/);
  const days = match ? parseInt(match[0], 10) : 30; // default 30 days if nothing parseable
  return days * 24 * 60 * 60 * 1000;
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
