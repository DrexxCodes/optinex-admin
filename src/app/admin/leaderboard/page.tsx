'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useAdminLeaderboard } from './lib/useAdminLeaderboard';
import { CASINO_GAMES } from './lib/games';
import type { CasinoGameId } from '@/lib/redis';
import LeaderboardGameTabs from './components/LeaderboardGameTabs';
import LeaderboardTable from './components/LeaderboardTable';

export default function AdminLeaderboardPage() {
  const [activeGame, setActiveGame] = useState<CasinoGameId>('brick-slasher');
  const { entries, loading, loadingMore, hasMore, loadNextPage } = useAdminLeaderboard(activeGame);
  const activeLabel = CASINO_GAMES.find((g) => g.id === activeGame)?.label ?? activeGame;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink/60">Top scores for {activeLabel}, read live from Upstash.</p>
        </div>
        <Link
          href="/admin/reset"
          className="flex items-center gap-2 rounded-xl bg-ink/5 px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/10"
        >
          <RotateCcw size={15} /> Manage resets
        </Link>
      </div>

      <LeaderboardGameTabs active={activeGame} onChange={setActiveGame} />

      {loading ? (
        <div className="mt-3 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <LeaderboardTable entries={entries} />
          {hasMore && (
            <button
              onClick={loadNextPage}
              disabled={loadingMore}
              className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-ink/70 shadow-sm transition hover:text-ink disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'View next 10'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
