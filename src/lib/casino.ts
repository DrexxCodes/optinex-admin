// Casino game ids — display/type registry only. The backend (optinex-backend, src/config/constants.ts)
// owns the leaderboards; keep this list in sync with it.
export const CASINO_GAME_IDS = ['brick-slasher', 'reaction-tap', 'stack-tower', 'endless-runner'] as const;
export type CasinoGameId = (typeof CASINO_GAME_IDS)[number];
