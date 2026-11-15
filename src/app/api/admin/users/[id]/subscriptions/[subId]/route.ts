import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { UUID_RE, rpcMessage } from '@/lib/db/format';

// Revokes an ACTIVE package investment or account upgrade.
//   body: { kind: 'package' | 'upgrade' }
//
// The row is kept (status -> 'revoked', with who/when) so it stays in the user's history and the
// audit trail. The profile is only touched when the revoked row is what's actually live on it:
//   - package: reset to Free only if this is the user's current package. An older, already-replaced
//     package is just marked revoked.
//   - upgrade: back to a standard account unless another active upgrade row still backs the tier.
// Runs as one Postgres function (profile row locked) so the "is it live?" check and the write can't
// be split by a concurrent approval.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id, subId } = await params;
  const { kind } = await req.json();
  if (kind !== 'package' && kind !== 'upgrade') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const { data, error } = await supabaseAdmin.rpc('revoke_subscription', {
    p_user: id,
    p_sub: subId,
    p_kind: kind,
    p_admin: admin.uid
  });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (msg === 'SUB_NOT_FOUND') return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    if (msg === 'NOT_ACTIVE') return NextResponse.json({ error: 'Only active subscriptions can be revoked.' }, { status: 400 });
    console.error('[admin/revoke]', error);
    return NextResponse.json({ error: 'Could not revoke this subscription.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data ?? {}) });
}
