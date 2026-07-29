import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { resetAnalyticsFields } from '@/lib/resetAnalytics';
import { resetLeaderboard } from '@/lib/resetLeaderboard';

const CATEGORIES = ['financial', 'checkin', 'signup', 'game'] as const;
type Category = (typeof CATEGORIES)[number];

// Which analytics fields belong to each category. Deliberately never
// includes the shared `total` / `amountTotal` counters (incremented by
// every action) — resetting one category must not erase another's history.
const CATEGORY_FIELDS: Record<Category, string[]> = {
  financial: [
    'revenueTotal',
    'revenueEvents',
    'counts.investment_submitted',
    'counts.investment_verified',
    'counts.account_upgrade_submitted',
    'counts.account_upgrade_verified'
  ],
  checkin: ['counts.checkin'],
  signup: ['counts.signup'],
  game: ['counts.casino_score_submitted']
};

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { category } = await req.json();
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Category must be one of: ${CATEGORIES.join(', ')}.` }, { status: 400 });
  }

  await resetAnalyticsFields(CATEGORY_FIELDS[category as Category]);

  // Game stats live primarily in Upstash, not Firestore — wipe the
  // leaderboard sorted set/username hash and zero each user's highScore too.
  if (category === 'game') {
    await resetLeaderboard();
  }

  return NextResponse.json({ ok: true, category });
}
