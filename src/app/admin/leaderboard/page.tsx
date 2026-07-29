'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useAdminLeaderboard } from './lib/useAdminLeaderboard';
import LeaderboardTable from './components/LeaderboardTable';

export default function AdminLeaderboardPage() {
  const { entries, loading, resetting, resetMessage, resetLeaderboard } = useAdminLeaderboard();
  const [confirming, setConfirming] = useState(false);

  const handleReset = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await resetLeaderboard();
    setConfirming(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink/60">Top scores from the Brick Slasher game, read live from Upstash.</p>
        </div>
        <button
          onClick={handleReset}
          onBlur={() => setConfirming(false)}
          disabled={resetting || entries.length === 0}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            confirming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
          }`}
        >
          <RotateCcw size={15} />
          {resetting ? 'Resetting…' : confirming ? 'Click again to confirm' : 'Reset Scores'}
        </button>
      </div>

      {resetMessage && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{resetMessage}</p>
      )}

      {loading ? <div className="mt-3 h-64 animate-pulse rounded-2xl bg-white/60" /> : <LeaderboardTable entries={entries} />}
    </div>
  );
}
