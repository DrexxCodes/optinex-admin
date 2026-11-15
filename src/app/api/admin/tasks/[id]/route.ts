import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

// API field -> column
const FIELD_MAP = {
  name: 'name',
  details: 'details',
  buttonLabel: 'button_label',
  link: 'link',
  reward: 'reward',
  active: 'active'
} as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(FIELD_MAP)) {
    if (body[key] !== undefined) update[column] = body[key];
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('tasks').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not update this task.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  await supabaseAdmin.from('tasks').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
