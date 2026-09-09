import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

const resetLogRef = adminDb.collection('system').doc('resetLog');

export type ResetLogCategory = 'financial' | 'checkin' | 'signup' | 'referral' | 'withdrawals' | 'nuke';

// Records "this got reset just now". Uses a real nested object for the
// per-game case (`{ game: { [gameId]: now } }`) rather than a dotted string
// key like `'game.brick-slasher'` — Firestore's set-merge only nests real
// object literals; a dotted *string* key is stored as one literal field
// named "game.brick-slasher" instead of a nested map. (This exact mismatch
// is also what broke the Overview signup chart — see api/admin/overview.)
export async function recordReset(category: ResetLogCategory) {
  await resetLogRef.set({ [category]: FieldValue.serverTimestamp() }, { merge: true });
}

export async function recordGameReset(gameId: CasinoGameId | 'all') {
  await resetLogRef.set({ game: { [gameId]: FieldValue.serverTimestamp() } }, { merge: true });
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
  const snap = await resetLogRef.get();
  const data = snap.exists ? snap.data()! : {};
  const toIso = (v: unknown): string | null => {
    const ts = v as { toDate?: () => Date } | undefined;
    return ts?.toDate?.()?.toISOString?.() ?? null;
  };

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
