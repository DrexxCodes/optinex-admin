import { getConfig, mergeConfig } from '@/lib/db/config';
import { CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

export type ResetLogCategory = 'financial' | 'checkin' | 'signup' | 'referral' | 'withdrawals' | 'nuke';

type StoredLog = Partial<Record<ResetLogCategory, string>> & { game?: Partial<Record<CasinoGameId | 'all', string>> };

// Records "this got reset just now" in the `resetLog` config row (ISO timestamps).
export async function recordReset(category: ResetLogCategory) {
  await mergeConfig('resetLog', { [category]: new Date().toISOString() });
}

export async function recordGameReset(gameId: CasinoGameId | 'all') {
  const existing = (await getConfig<StoredLog>('resetLog'))?.game ?? {};
  await mergeConfig('resetLog', { game: { ...existing, [gameId]: new Date().toISOString() } });
}

export type ResetLog = {
  financial: string | null;
  checkin: string | null;
  signup: string | null;
  referral: string | null;
  withdrawals: string | null;
  nuke: string | null;
  game: Record<CasinoGameId | 'all', string | null>;
};

export async function getResetLog(): Promise<ResetLog> {
  const data = (await getConfig<StoredLog>('resetLog')) ?? {};
  const toIso = (v: unknown): string | null => (typeof v === 'string' && v ? new Date(v).toISOString() : null);

  const game = {} as Record<CasinoGameId | 'all', string | null>;
  for (const id of [...CASINO_GAME_IDS, 'all' as const]) {
    game[id] = toIso(data.game?.[id]);
  }

  return {
    financial: toIso(data.financial),
    checkin: toIso(data.checkin),
    signup: toIso(data.signup),
    referral: toIso(data.referral),
    withdrawals: toIso(data.withdrawals),
    nuke: toIso(data.nuke),
    game
  };
}
