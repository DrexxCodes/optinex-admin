import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { generateReference } from '@/lib/refGenerator';
import { UUID_RE, rpcMessage } from '@/lib/db/format';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { amount, note } = await req.json();
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount greater than zero.' }, { status: 400 });
  }
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const txnRef = generateReference();

  // Written with the exact same fields the user app's wallet-transactions list expects, in one
  // atomic call (wallet bump + transaction row), so it renders identically in the user's history.
  const { data: balance, error } = await supabaseAdmin.rpc('credit_wallet', {
    p_user: id,
    p_amount: amount,
    p_name: (typeof note === 'string' && note.trim()) || 'Wallet funded by admin',
    p_ref: txnRef
  });

  if (error) {
    if (rpcMessage(error) === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    console.error('[admin/wallet]', error);
    return NextResponse.json({ error: 'Could not fund this wallet.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, walletAmount: Number(balance ?? 0), txnRef });
}
