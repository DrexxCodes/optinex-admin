import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';

// Used by /welcome to confirm admin access. Accounts are NO LONGER promoted here: an account is
// an admin only if `profiles.is_admin` was set in the database (or by an existing admin via the
// Users page). Everyone else gets a 403.
export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data } = await supabaseAdmin.from('profiles').select('full_name, is_admin').eq('id', session.uid).maybeSingle();
  if (!data) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (data.is_admin !== true) {
    return NextResponse.json({ error: 'This account does not have admin access.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, fullName: data.full_name ?? '', wasAlreadyAdmin: true });
}
