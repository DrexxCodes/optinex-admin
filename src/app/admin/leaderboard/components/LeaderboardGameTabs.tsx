'use client';

import { CASINO_GAMES } from '../lib/games';
import type { CasinoGameId } from '@/lib/redis';

export default function LeaderboardGameTabs({ active, onChange }: { active: CasinoGameId; onChange: (id: CasinoGameId) => void }) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {CASINO_GAMES.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === g.id ? 'bg-brand-500 text-white' : 'bg-white text-ink/60 shadow-sm hover:text-ink'
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
