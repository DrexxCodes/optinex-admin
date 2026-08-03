// Mirrors CASINO_GAME_IDS in src/lib/redis.ts — kept as a small display
// registry here (label) since the admin UI needs a human-readable name per
// tab, not just the id.
import type { CasinoGameId } from '@/lib/redis';

export const CASINO_GAMES: { id: CasinoGameId; label: string }[] = [
  { id: 'brick-slasher', label: 'Brick Slasher' },
  { id: 'reaction-tap', label: 'Reaction Tap' },
  { id: 'stack-tower', label: 'Stack Tower' },
  { id: 'endless-runner', label: 'Endless Runner' }
];
