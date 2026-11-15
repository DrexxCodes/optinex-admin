import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { iso, num } from '@/lib/db/format';

// Looks a single user up by exact email or exact username — a single indexed-equality query.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('email') ?? searchParams.get('username') ?? searchParams.get('q'))?.trim();
  if (!query) return NextResponse.json({ error: 'Provide an email or username to search for.' }, { status: 400 });

  // An email always contains "@"; anything else is treated as a username.
  const field = query.includes('@') ? 'email' : 'username';
  const value = query.toLowerCase();

  const { data: u } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, email, wallet_amount, package_status, account_tier, is_admin, created_at')
    .eq(field, value)
    .limit(1)
    .maybeSingle();
  if (!u) {
    return NextResponse.json({ error: `No user found with that ${field}.` }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      uid: u.id,
      fullName: u.full_name,
      username: u.username,
      email: u.email,
      walletAmount: num(u.wallet_amount),
      packageStatus: u.package_status ?? 'Free',
      accountTier: u.account_tier ?? 'standard',
      admin: u.is_admin === true,
      createdAt: iso(u.created_at)
    }
  });
}
