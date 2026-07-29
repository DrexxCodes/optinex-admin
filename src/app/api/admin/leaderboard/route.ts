import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { redis, LEADERBOARD_KEY, LEADERBOARD_NAMES_KEY } from '@/lib/redis';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  // Top 100, highest score first — same read pattern as the user app's own
  // leaderboard route, against the same Upstash keys.
  const top = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, 99, { rev: true, withScores: true });

  const raw: { uid: string; score: number }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    raw.push({ uid: String(top[i]), score: Number(top[i + 1]) });
  }

  const uids = raw.map((e) => e.uid);
  const usernames = uids.length ? await redis.hmget<Record<string, string>>(LEADERBOARD_NAMES_KEY, ...uids) : {};

  const entries = raw.map((e, i) => ({ rank: i + 1, uid: e.uid, username: usernames?.[e.uid] ?? 'Unknown', score: e.score }));

  return NextResponse.json({ entries, total: entries.length });
}
