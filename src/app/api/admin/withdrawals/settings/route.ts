import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getConfig, mergeConfig } from '@/lib/db/config';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const data = await getConfig<{ enabledDate?: string }>('withdrawal');
  const enabledDate = data?.enabledDate ? new Date(data.enabledDate).toISOString() : null;
  return NextResponse.json({ enabledDate });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { enabledDate } = await req.json();
  const date = enabledDate ? new Date(enabledDate) : null;
  if (!date || Number.isNaN(date.getTime())) return NextResponse.json({ error: 'Pick a date.' }, { status: 400 });

  await mergeConfig('withdrawal', { enabledDate: date.toISOString() });
  return NextResponse.json({ ok: true });
}
