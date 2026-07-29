import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { resetLeaderboard } from '@/lib/resetLeaderboard';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { clearedCount } = await resetLeaderboard();
  return NextResponse.json({ ok: true, clearedCount });
}
