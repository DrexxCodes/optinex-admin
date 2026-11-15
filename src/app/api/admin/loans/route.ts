import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { LOAN_STAGES, isLoanStage } from '@/lib/loans/config';
import { iso, num } from '@/lib/db/format';

const LIST_LIMIT = 200;

// Lists loan applications, optionally filtered by ?status=. Also returns a per-stage count so the
// tabs can show totals regardless of the active filter.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status');

  let listQuery = supabaseAdmin
    .from('loans')
    .select(
      'id, user_id, full_name, username, amount, status, reference, bank_account, reason, applicant, next_of_kin, created_at, status_changed_at, profiles(full_name, username)'
    )
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (isLoanStage(status)) listQuery = listQuery.eq('status', status);

  const [listRes, ...countRes] = await Promise.all([
    listQuery,
    ...LOAN_STAGES.map((s) => supabaseAdmin.from('loans').select('id', { count: 'exact', head: true }).eq('status', s))
  ]);

  const counts = Object.fromEntries(LOAN_STAGES.map((s, i) => [s, countRes[i].count ?? 0])) as Record<string, number>;

  const loans = (listRes.data ?? []).map((l: any) => {
    const user = l.profiles;
    return {
      id: l.id,
      uid: l.user_id,
      // Live user lookup first, falling back to the snapshot taken at application time.
      fullName: user?.full_name ?? l.full_name ?? 'Unknown user',
      username: user?.username ?? l.username ?? '',
      amount: num(l.amount),
      status: l.status,
      reference: l.reference,
      bankAccount: l.bank_account,
      reason: l.reason ?? null,
      applicant: l.applicant ?? null,
      nextOfKin: l.next_of_kin ?? null,
      createdAt: iso(l.created_at),
      statusChangedAt: iso(l.status_changed_at)
    };
  });

  return NextResponse.json({ loans, counts });
}
