'use client';

import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { CASINO_GAMES } from '../../leaderboard/lib/games';
import { formatResetTime } from '../lib/formatResetTime';
import type { CasinoGameId } from '../lib/useAdminReset';

export default function GameResetPicker({
  lastResetByGame,
  resetting,
  result,
  onReset
}: {
  lastResetByGame: Record<CasinoGameId | 'all', string | null>;
  resetting: string | null; // 'game:<id>' | 'game:all' | null
  result: { key: string; ok: boolean; error?: string } | null;
  onReset: (gameId?: CasinoGameId) => void;
}) {
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const rows: { key: string; label: string; gameId?: CasinoGameId }[] = [
    ...CASINO_GAMES.map((g) => ({ key: `game:${g.id}`, label: g.label, gameId: g.id })),
    { key: 'game:all', label: 'All games' }
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:col-span-2">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Gamepad2 size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Game Stats</p>
          <p className="mt-0.5 text-xs text-ink/50">
            Pick a game to wipe its Upstash leaderboard (scores + usernames) and zero players&apos; high score for it — or wipe all four at once.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(({ key, label, gameId }) => {
          const isConfirming = confirmingKey === key;
          const isResetting = resetting === key;
          const justRan = result?.key === key;
          const lastReset = lastResetByGame[gameId ?? 'all'];

          return (
            <div key={key} className={`rounded-xl px-3 py-2.5 ${gameId ? 'bg-ink/[0.02]' : 'bg-red-50/60'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="text-xs text-ink/35">{formatResetTime(lastReset)}</p>
                </div>
                <button
                  onClick={() => {
                    if (!isConfirming) {
                      setConfirmingKey(key);
                      return;
                    }
                    setConfirmingKey(null);
                    onReset(gameId);
                  }}
                  onBlur={() => setConfirmingKey((c) => (c === key ? null : c))}
                  disabled={isResetting}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    isConfirming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
                  }`}
                >
                  {isResetting ? 'Resetting…' : isConfirming ? 'Confirm' : 'Reset'}
                </button>
              </div>
              {justRan && (
                <p
                  className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    result?.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {result?.ok ? `${label} reset.` : (result?.error ?? 'Could not reset.')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
