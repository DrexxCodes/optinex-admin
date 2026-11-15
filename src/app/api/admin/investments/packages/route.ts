import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { num } from '@/lib/db/format';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('packages')
    .select('id, name, price, duration, details, active')
    .order('price', { ascending: true });

  return NextResponse.json({
    packages: (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: num(p.price),
      duration: p.duration,
      details: p.details ?? [],
      active: p.active !== false
    }))
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { name, price, duration, details } = await req.json();
  if (!name || !price || price <= 0 || !duration) {
    return NextResponse.json({ error: 'Name, price, and duration are required.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('packages')
    .insert({
      name,
      price,
      duration,
      details: Array.isArray(details) ? details.filter(Boolean) : [],
      active: true
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not create this package.' }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id });
}
