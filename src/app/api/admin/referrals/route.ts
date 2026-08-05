import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getReferralLeaderboard, getReferralWeeklyResetLog } from '@/lib/referralWeekly';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const [leaderboard, lastReset] = await Promise.all([getReferralLeaderboard(), getReferralWeeklyResetLog()]);

  return NextResponse.json({ leaderboard, lastReset });
}
