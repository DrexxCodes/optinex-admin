import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { UUID_RE } from '@/lib/db/format';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { admin: makeAdmin } = await req.json();
  if (typeof makeAdmin !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  if (id === admin.uid && !makeAdmin) {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const { data, error } = await supabaseAdmin.from('profiles').update({ is_admin: makeAdmin }).eq('id', id).select('id');
  if (error) return NextResponse.json({ error: 'Could not update this user.' }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
