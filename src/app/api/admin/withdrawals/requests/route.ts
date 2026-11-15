import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { iso, num } from '@/lib/db/format';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  // One query: pending withdrawals with the owner's name joined in (no per-row user lookups).
  const { data } = await supabaseAdmin
    .from('withdrawals')
    .select('id, user_id, amount, payout_method, reference, created_at, profiles(full_name, username)')
    .eq('status', 'pending');

  const requests = (data ?? []).map((r: any) => ({
    id: r.id,
    uid: r.user_id,
    fullName: r.profiles?.full_name ?? 'Unknown user',
    username: r.profiles?.username ?? '',
    amount: num(r.amount),
    payoutMethod: r.payout_method,
    reference: r.reference,
    createdAt: iso(r.created_at)
  }));

  requests.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ requests });
}
