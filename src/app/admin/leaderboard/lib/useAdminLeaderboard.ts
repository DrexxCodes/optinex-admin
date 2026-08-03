'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import type { CasinoGameId } from '@/lib/redis';

export type LeaderboardEntry = { rank: number; uid: string; username: string; score: number };

const PAGE_SIZE = 10;

// One page (10 rows) per request, for whichever game tab is active. Paging
// forward asks Upstash for the next 10 ranks directly (via `offset`) rather
// than ever pulling a large top-N list — see api/admin/leaderboard/route.ts.
export function useAdminLeaderboard(gameId: CasinoGameId) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await authFetch(`/api/admin/leaderboard?game=${gameId}&offset=${pageOffset}`);
        if (!res.ok) return;
        const data = await res.json();
        setEntries((prev) => (append ? [...prev, ...data.entries] : data.entries));
        setHasMore(data.hasMore);
        setOffset(pageOffset);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [gameId]
  );

  // Switching game tabs resets to the first page.
  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const loadNextPage = useCallback(() => loadPage(offset + PAGE_SIZE, true), [loadPage, offset]);

  return { entries, loading, loadingMore, hasMore, loadNextPage };
}
