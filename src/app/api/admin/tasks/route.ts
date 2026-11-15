import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { num } from '@/lib/db/format';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('tasks')
    .select('id, name, details, button_label, link, reward, active')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    tasks: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      details: t.details,
      buttonLabel: t.button_label ?? '',
      link: t.link ?? '',
      reward: num(t.reward),
      active: t.active !== false
    }))
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { name, details, buttonLabel, link, reward } = await req.json();
  if (!name || !details || !reward || reward <= 0) {
    return NextResponse.json({ error: 'Name, details, and reward are required.' }, { status: 400 });
  }

  // buttonLabel/link are optional — if the admin leaves them blank the user app just renders a
  // plain "Complete" button with no outbound link.
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({ name, details, button_label: buttonLabel || '', link: link || '', reward: Number(reward), active: true })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not create this task.' }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id });
}
