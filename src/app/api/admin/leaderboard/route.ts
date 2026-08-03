import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { redis, gameLeaderboardKey, gameLeaderboardNamesKey, CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

const PAGE_SIZE = 10;

// Paginated per-game leaderboard read. Only ever pulls PAGE_SIZE (+1 to
// cheaply detect a next page) entries per request from Upstash — never the
// old "always fetch top 100" approach — so browsing pages costs one small
// zrange + one hmget against just those uids, not a bulk pull up front.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const gameParam = req.nextUrl.searchParams.get('game');
  const gameId: CasinoGameId = CASINO_GAME_IDS.includes(gameParam as CasinoGameId)
    ? (gameParam as CasinoGameId)
    : 'brick-slasher';

  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0) || 0);

  const leaderboardKey = gameLeaderboardKey(gameId);
  const namesKey = gameLeaderboardNamesKey(gameId);

  // Ask for one extra rank than we'll show — if it comes back, there's a next page.
  const raw = await redis.zrange<string[]>(leaderboardKey, offset, offset + PAGE_SIZE, {
    rev: true,
    withScores: true
  });

  const raw2: { uid: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    raw2.push({ uid: String(raw[i]), score: Number(raw[i + 1]) });
  }

  const hasMore = raw2.length > PAGE_SIZE;
  const pageEntries = raw2.slice(0, PAGE_SIZE);

  const uids = pageEntries.map((e) => e.uid);
  const usernames = uids.length ? await redis.hmget<Record<string, string>>(namesKey, ...uids) : {};

  const entries = pageEntries.map((e, i) => ({
    rank: offset + i + 1,
    uid: e.uid,
    username: usernames?.[e.uid] ?? 'Unknown',
    score: e.score
  }));

  return NextResponse.json({ entries, hasMore, offset, game: gameId });
}
