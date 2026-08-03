import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { resetAnalyticsFields } from '@/lib/resetAnalytics';
import { resetLeaderboard, resetAllLeaderboards } from '@/lib/resetLeaderboard';
import { resetReferralStats } from '@/lib/resetReferral';
import { resetPendingWithdrawals } from '@/lib/resetWithdrawals';
import { recordReset, recordGameReset, getResetLog } from '@/lib/resetLog';
import { CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

const CATEGORIES = ['financial', 'checkin', 'signup', 'game', 'referral', 'withdrawals'] as const;
type Category = (typeof CATEGORIES)[number];

// Which analytics fields belong to each category. Deliberately never
// includes the shared `total` / `amountTotal` counters (incremented by
// every action) — resetting one category must not erase another's history.
const CATEGORY_FIELDS: Record<'financial' | 'checkin' | 'signup', string[]> = {
  financial: [
    'revenueTotal',
    'revenueEvents',
    'counts.investment_submitted',
    'counts.investment_verified',
    'counts.account_upgrade_submitted',
    'counts.account_upgrade_verified'
  ],
  checkin: ['counts.checkin'],
  signup: ['counts.signup']
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  return NextResponse.json({ resetLog: await getResetLog() });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { category, gameId } = await req.json();
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${CATEGORIES.join(', ')}.` }, { status: 400 });
  }
  const c = category as Category;

  const validGameId: CasinoGameId | null = CASINO_GAME_IDS.includes(gameId) ? (gameId as CasinoGameId) : null;

  if (c === 'financial' || c === 'checkin' || c === 'signup') {
    await resetAnalyticsFields(CATEGORY_FIELDS[c]);
    await recordReset(c);
  } else if (c === 'game') {
    if (validGameId) {
      await resetLeaderboard(validGameId);
      await recordGameReset(validGameId);
    } else {
      await resetAllLeaderboards();
      await recordGameReset('all');
    }
  } else if (c === 'referral') {
    await resetReferralStats();
    await recordReset('referral');
  } else if (c === 'withdrawals') {
    await resetPendingWithdrawals();
    await recordReset('withdrawals');
  }

  return NextResponse.json({ ok: true, category: c, gameId: validGameId, resetLog: await getResetLog() });
}
