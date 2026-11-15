import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { rpcMessage } from '@/lib/db/format';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  // approve: the wallet was already debited when the request was made — the payout itself happens
  // externally (bank transfer), so approving just marks it settled ('paid').
  // reject: marks it failed, refunds the wallet and records the credit — all atomically.
  const { error } = await supabaseAdmin.rpc('resolve_withdrawal', { p_id: id, p_action: action });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (msg === 'RESOLVED') return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 });
    console.error('[admin/withdrawals resolve]', error);
    return NextResponse.json({ error: 'Could not resolve this request.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
