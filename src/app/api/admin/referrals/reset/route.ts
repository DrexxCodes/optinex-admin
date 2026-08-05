import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { resetWeeklyReferrals, getReferralWeeklyResetLog } from '@/lib/referralWeekly';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { cleared } = await resetWeeklyReferrals();
  const lastReset = await getReferralWeeklyResetLog();

  return NextResponse.json({ ok: true, cleared, lastReset });
}
