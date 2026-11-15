import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Builds the last `days` daily analytics ids, most recent last, e.g. ['2026-07-26', '2026-07-27', '2026-07-28'].
function lastDayIds(days: number) {
  const ids: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    ids.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return ids;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const now = new Date();
  const monthId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const yearId = `${now.getFullYear()}`;
  const dayIds = lastDayIds(3);

  // Every count, sum and per-package subscriber tally comes back from ONE Postgres call
  // (public.admin_overview) — no document scans, no per-package round trips.
  const { data: o, error } = await supabaseAdmin.rpc('admin_overview', {
    p_day_ids: dayIds,
    p_month: monthId,
    p_year: yearId
  });
  if (error || !o) {
    console.error('[admin/overview]', error);
    return NextResponse.json({ error: 'Could not load the overview.' }, { status: 500 });
  }

  const byDate = new Map<string, any>((o.daily ?? []).map((d: any) => [d.date as string, d]));
  const signups = dayIds.map((date) => ({ date, signups: byDate.get(date)?.signups ?? 0 }));
  const todayEntry = byDate.get(dayIds[dayIds.length - 1]);

  return NextResponse.json({
    totalUsers: o.totalUsers,
    freeUsers: o.freeUsers,
    upgradedUsers: o.upgradedUsers,
    pendingUpgrades: o.pendingUpgrades,
    pendingInvestments: o.pendingInvestments,
    pendingWithdrawals: o.pendingWithdrawals,
    pendingWithdrawalTotal: o.pendingWithdrawalTotal,
    packages: o.packages ?? [],
    signups,
    // "Financial Stats" is real revenue only — money confirmed the moment an admin approves a
    // submitted investment/upgrade receipt — not the blended amount total.
    financial: {
      daily: { label: dayIds[dayIds.length - 1], amountTotal: todayEntry?.revenueTotal ?? 0, total: todayEntry?.revenueEvents ?? 0 },
      monthly: { label: monthId, amountTotal: o.monthly?.revenueTotal ?? 0, total: o.monthly?.revenueEvents ?? 0 },
      yearly: { label: yearId, amountTotal: o.yearly?.revenueTotal ?? 0, total: o.yearly?.revenueEvents ?? 0 }
    }
  });
}
