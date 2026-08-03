// Upstash Redis — same instance/keys as the user app's casino leaderboards.
// Needed here so the admin app can read and reset them. Keep this in sync
// with optinex-user's src/lib/redis.ts by hand (separate deployments,
// same Upstash instance/keys — there's no shared package between the two apps).
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Casino now hosts 4 games, each with its own leaderboard, namespaced per game.
export const CASINO_GAME_IDS = ['brick-slasher', 'reaction-tap', 'stack-tower', 'endless-runner'] as const;
export type CasinoGameId = (typeof CASINO_GAME_IDS)[number];

export function gameLeaderboardKey(gameId: CasinoGameId) {
  return `casino:leaderboard:${gameId}`;
}
export function gameLeaderboardNamesKey(gameId: CasinoGameId) {
  return `casino:usernames:${gameId}`;
}

// Sorted set of referral counts: member = uid (the referrer), score = number of
// successful referrals. Incremented once per valid referral at signup time.
export const REFERRAL_LEADERBOARD_KEY = 'referral:leaderboard';
// Hash mapping uid -> JSON.stringify({ fullName, username }), kept in sync so the
// leaderboard never needs a Firestore join to render names.
export const REFERRAL_LEADERBOARD_NAMES_KEY = 'referral:names';
