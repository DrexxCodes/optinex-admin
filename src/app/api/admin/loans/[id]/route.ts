import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { buildLoanTimeline, isLoanStage, nextLoanStage } from '@/lib/loans/config';
import { rpcMessage } from '@/lib/db/format';

// Full timeline for one application (the list endpoint stays light by not reading every
// application's timeline).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { data: loan } = await supabaseAdmin
    .from('loans')
    .select('status, loan_timeline(status, at, by)')
    .eq('id', id)
    .maybeSingle();
  if (!loan) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  return NextResponse.json({
    id,
    status: loan.status,
    timeline: buildLoanTimeline((loan as any).loan_timeline ?? [])
  });
}

// Moves an application exactly one step forward. The caller states the stage it believes the
// application is in (`from`) and the stage it wants (`to`); both are checked against the live row
// inside a Postgres function (row locked), so a double-click or two admins acting at once can
// never skip a stage.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { from, to } = await req.json().catch(() => ({}));
  if (!isLoanStage(from) || !isLoanStage(to) || nextLoanStage(from) !== to) {
    return NextResponse.json({ error: 'Applications can only move one step forward.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc('advance_loan', { p_id: id, p_from: from, p_to: to, p_admin: admin.uid });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (msg === 'STALE') {
      return NextResponse.json({ error: 'This application has already moved on. Refresh to see its latest status.' }, { status: 409 });
    }
    console.error('[admin/loans PATCH]', error);
    return NextResponse.json({ error: 'Could not update this application.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
