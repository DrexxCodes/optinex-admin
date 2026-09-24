import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { newestActivePackageDoc } from '@/lib/userSubscriptions';

const STATUSES = ['pending', 'active', 'failed', 'revoked'] as const;
type Status = (typeof STATUSES)[number];

const normalizeStatus = (s: unknown): Status => (STATUSES.includes(s as Status) ? (s as Status) : 'failed');
const epochToIso = (n: unknown) => (typeof n === 'number' ? new Date(n).toISOString() : null);

// Everything this user has ever bought — package investments and account
// upgrades — in one list, newest first. Both collections are queried by a
// single indexed equality (`uid`) so no composite index is needed, and a
// single user only ever has a handful of docs.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;

  const [userSnap, investmentsSnap, upgradesSnap] = await Promise.all([
    adminDb.collection('users').doc(id).get(),
    adminDb.collection('investments').where('uid', '==', id).get(),
    adminDb.collection('accountUpgrades').where('uid', '==', id).get()
  ]);
  if (!userSnap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  const user = userSnap.data()!;

  const liveDoc = user.packageId ? newestActivePackageDoc(investmentsSnap.docs, user.packageId) : null;

  const packages = investmentsSnap.docs.map((d) => {
    const r = d.data();
    const status = normalizeStatus(r.status);
    const current = status === 'active' && liveDoc?.id === d.id;
    return {
      id: d.id,
      kind: 'package' as const,
      name: r.packageName ?? 'Package',
      amount: r.amount ?? 0,
      reference: r.reference ?? '',
      receiptUrl: r.receiptUrl ?? '',
      status,
      current,
      startedAt: current ? epochToIso(user.packageStartedAt) : null,
      expiresAt: current ? epochToIso(user.packageExpiresAt) : null,
      expired: current && typeof user.packageExpiresAt === 'number' && user.packageExpiresAt < Date.now(),
      createdAt: r.createdAt?.toDate?.()?.toISOString?.() ?? null
    };
  });

  const upgrades = upgradesSnap.docs.map((d) => {
    const r = d.data();
    const status = normalizeStatus(r.status);
    return {
      id: d.id,
      kind: 'upgrade' as const,
      name: 'Account Upgrade',
      amount: r.amount ?? 0,
      reference: r.reference ?? '',
      receiptUrl: r.receiptUrl ?? '',
      status,
      current: status === 'active',
      startedAt: null,
      expiresAt: null,
      expired: false,
      createdAt: r.createdAt?.toDate?.()?.toISOString?.() ?? null
    };
  });

  const subscriptions = [...packages, ...upgrades].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ subscriptions });
}
