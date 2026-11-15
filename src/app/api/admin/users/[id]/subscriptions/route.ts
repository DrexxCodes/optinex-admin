import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { UUID_RE, iso, num } from '@/lib/db/format';

const STATUSES = ['pending', 'active', 'failed', 'revoked'] as const;
type Status = (typeof STATUSES)[number];

const normalizeStatus = (s: unknown): Status => (STATUSES.includes(s as Status) ? (s as Status) : 'failed');
const epochToIso = (n: unknown) => (typeof n === 'number' ? new Date(n).toISOString() : null);

// Everything this user has ever bought — package investments and account upgrades — in one list,
// newest first. A single user only ever has a handful of rows.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const [userRes, invRes, upRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('package_id, package_started_at, package_expires_at').eq('id', id).maybeSingle(),
    supabaseAdmin.from('investments').select('*').eq('user_id', id),
    supabaseAdmin.from('account_upgrades').select('*').eq('user_id', id)
  ]);
  const user = userRes.data;
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const investments = invRes.data ?? [];

  // A user's profile only holds ONE package (the last one an admin approved), but older approved
  // investment rows stay `active` after a newer package replaces them. So "is this the live
  // package?" means: it's the newest active row for the package the profile currently points at.
  // (Same rule as the revoke function, so the two can never disagree.)
  let liveId: string | null = null;
  if (user.package_id) {
    const active = investments
      .filter((r) => r.status === 'active' && r.package_id === user.package_id)
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '') || String(b.id).localeCompare(String(a.id)));
    liveId = active[0]?.id ?? null;
  }

  const packages = investments.map((r) => {
    const status = normalizeStatus(r.status);
    const current = status === 'active' && liveId === r.id;
    return {
      id: r.id,
      kind: 'package' as const,
      name: r.package_name ?? 'Package',
      amount: num(r.amount),
      reference: r.reference ?? '',
      receiptUrl: r.receipt_url ?? '',
      status,
      current,
      startedAt: current ? epochToIso(user.package_started_at) : null,
      expiresAt: current ? epochToIso(user.package_expires_at) : null,
      expired: current && typeof user.package_expires_at === 'number' && user.package_expires_at < Date.now(),
      createdAt: iso(r.created_at)
    };
  });

  const upgrades = (upRes.data ?? []).map((r) => {
    const status = normalizeStatus(r.status);
    return {
      id: r.id,
      kind: 'upgrade' as const,
      name: 'Account Upgrade',
      amount: num(r.amount),
      reference: r.reference ?? '',
      receiptUrl: r.receipt_url ?? '',
      status,
      current: status === 'active',
      startedAt: null,
      expiresAt: null,
      expired: false,
      createdAt: iso(r.created_at)
    };
  });

  const subscriptions = [...packages, ...upgrades].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ subscriptions });
}
