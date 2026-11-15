import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAnalyticsEvent } from '@/lib/analytics';
import { rpcMessage } from '@/lib/db/format';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  // Request row + the user's tier/status flip in one atomic call (row locked; double-resolves rejected).
  const { data: amount, error } = await supabaseAdmin.rpc('resolve_upgrade', { p_id: id, p_action: action });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (msg === 'RESOLVED') return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 });
    console.error('[admin/upgrade resolve]', error);
    return NextResponse.json({ error: 'Could not resolve this request.' }, { status: 500 });
  }

  if (action === 'approve') {
    await logAnalyticsEvent('account_upgrade_verified', Number(amount ?? 0)).catch((e) => console.error('[admin/upgrade] analytics', e));
  }

  return NextResponse.json({ ok: true });
}
