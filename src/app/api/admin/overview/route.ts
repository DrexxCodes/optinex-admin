import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Builds the last `days` daily analytics doc ids, most recent last, e.g.
// ['2026-07-26', '2026-07-27', '2026-07-28'].
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

  const usersCol = adminDb.collection('users');
  const now = new Date();
  const monthId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const yearId = `${now.getFullYear()}`;
  const dayIds = lastDayIds(3);

  const [
    // Firestore count() aggregations bill roughly 1 read per 1,000 matched
    // docs and never transfer document data — this is the cheap way to get
    // user totals at scale instead of pulling every user document.
    totalUsersCount,
    pendingUpgradesSnap,
    pendingInvestmentsSnap,
    pendingWithdrawalsSnap,
    packagesSnap,
    freeUsersCount,
    dailyEntriesSnap,
    monthlyEntrySnap,
    yearlyEntrySnap
  ] = await Promise.all([
    usersCol.count().get(),
    adminDb.collection('accountUpgrades').where('status', '==', 'pending').get(),
    adminDb.collection('investments').where('status', '==', 'pending').get(),
    adminDb.collection('withdrawals').where('status', '==', 'pending').get(),
    adminDb.collection('packages').orderBy('price', 'asc').get(),
    usersCol.where('packageStatus', '==', 'Free').count().get(),
    adminDb.collection('analytics').doc('daily').collection('entries').where('date', 'in', dayIds).get(),
    adminDb.collection('analytics').doc('monthly').collection('entries').doc(monthId).get(),
    adminDb.collection('analytics').doc('yearly').collection('entries').doc(yearId).get()
  ]);

  const pendingWithdrawalTotal = pendingWithdrawalsSnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0);

  // One count() aggregation per package (still no full-document reads) to
  // tally subscribers, instead of scanning every user row.
  const packages = await Promise.all(
    packagesSnap.docs.map(async (d) => {
      const p = d.data();
      const subCount = await usersCol.where('packageStatus', '==', p.name).count().get();
      return { id: d.id, name: p.name, price: p.price, active: p.active !== false, subscribers: subCount.data().count };
    })
  );

  const entriesByDate = new Map(dailyEntriesSnap.docs.map((d) => [d.data().date as string, d.data()]));
  const signups = dayIds.map((date) => ({ date, signups: entriesByDate.get(date)?.counts?.signup ?? 0 }));

  const monthly = monthlyEntrySnap.exists ? monthlyEntrySnap.data()! : null;
  const yearly = yearlyEntrySnap.exists ? yearlyEntrySnap.data()! : null;
  const todayEntry = entriesByDate.get(dayIds[dayIds.length - 1]);

  return NextResponse.json({
    totalUsers: totalUsersCount.data().count,
    freeUsers: freeUsersCount.data().count,
    pendingUpgrades: pendingUpgradesSnap.size,
    pendingInvestments: pendingInvestmentsSnap.size,
    pendingWithdrawals: pendingWithdrawalsSnap.size,
    pendingWithdrawalTotal,
    packages,
    signups,
    // "Financial Stats" is real revenue only — money confirmed the moment an
    // admin approves a submitted investment/upgrade receipt — not the
    // blended amountTotal (which also holds reward payouts, unverified
    // submissions, withdrawals, and casino scores).
    financial: {
      daily: { label: dayIds[dayIds.length - 1], amountTotal: todayEntry?.revenueTotal ?? 0, total: todayEntry?.revenueEvents ?? 0 },
      monthly: { label: monthId, amountTotal: monthly?.revenueTotal ?? 0, total: monthly?.revenueEvents ?? 0 },
      yearly: { label: yearId, amountTotal: yearly?.revenueTotal ?? 0, total: yearly?.revenueEvents ?? 0 }
    }
  });
}
