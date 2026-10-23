import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { LOAN_STAGES, isLoanStage } from '@/lib/loans/config';

const LIST_LIMIT = 200;

// Lists loan applications, optionally filtered by ?status=. Also returns a
// per-stage count so the tabs can show totals regardless of the active filter.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status');
  const loansCol = adminDb.collection('loans');

  // Filtered: single-field where, sorted in memory (avoids a composite index).
  // Unfiltered: orderBy on a single field, which Firestore indexes by default.
  const listQuery = isLoanStage(status) ? loansCol.where('status', '==', status) : loansCol.orderBy('createdAt', 'desc').limit(LIST_LIMIT);

  const [listSnap, ...countSnaps] = await Promise.all([
    listQuery.get(),
    ...LOAN_STAGES.map((s) => loansCol.where('status', '==', s).count().get())
  ]);

  const counts = Object.fromEntries(LOAN_STAGES.map((s, i) => [s, countSnaps[i].data().count])) as Record<string, number>;

  const docs = listSnap.docs
    .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))
    .slice(0, LIST_LIMIT);

  // Live user lookups (same pattern as the other admin lists), batched so 200
  // rows don't mean 200 sequential reads.
  const uids = [...new Set(docs.map((d) => d.data().uid as string))];
  const userSnaps = uids.length ? await adminDb.getAll(...uids.map((u) => adminDb.collection('users').doc(u))) : [];
  const users = new Map(userSnaps.map((s) => [s.id, s.data()]));

  const loans = docs.map((d) => {
    const l = d.data();
    const user = users.get(l.uid);
    return {
      id: d.id,
      uid: l.uid,
      fullName: user?.fullName ?? l.fullName ?? 'Unknown user',
      username: user?.username ?? l.username ?? '',
      amount: l.amount,
      status: l.status,
      reference: l.reference,
      bankAccount: l.bankAccount,
      createdAt: l.createdAt?.toDate?.()?.toISOString?.() ?? null,
      statusChangedAt: l.statusChangedAt?.toDate?.()?.toISOString?.() ?? null
    };
  });

  return NextResponse.json({ loans, counts });
}
