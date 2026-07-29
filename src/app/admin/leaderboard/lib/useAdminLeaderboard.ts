'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type LeaderboardEntry = { rank: number; uid: string; username: string; score: number };

export function useAdminLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/admin/leaderboard');
    if (res.ok) setEntries((await res.json()).entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetLeaderboard = useCallback(async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await authFetch('/api/admin/leaderboard/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setResetMessage(data.error ?? 'Could not reset the leaderboard.');
        return false;
      }
      setEntries([]);
      setResetMessage(`Leaderboard reset — ${data.clearedCount} score${data.clearedCount === 1 ? '' : 's'} cleared.`);
      return true;
    } finally {
      setResetting(false);
    }
  }, []);

  return { entries, loading, resetting, resetMessage, resetLeaderboard, refresh: load };
}
