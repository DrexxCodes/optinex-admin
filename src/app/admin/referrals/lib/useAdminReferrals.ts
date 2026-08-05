'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type ReferralLeaderboardEntry = {
  uid: string;
  fullName: string;
  username: string;
  weeklyReferrals: number;
  allTimeReferrals: number;
  weeklyIncome: number;
  allTimeIncome: number;
  rank: number;
};

export function useAdminReferrals() {
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [lastReset, setLastReset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReferralLeaderboardEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/referrals');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
        setLastReset(data.lastReset);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resets everyone's weekly count, then reloads so the (now all-zero)
  // leaderboard and "last reset" timestamp reflect it immediately.
  const resetWeek = useCallback(async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await authFetch('/api/admin/referrals/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? 'Could not reset the weekly leaderboard.');
        return false;
      }
      setLastReset(data.lastReset);
      await load();
      return true;
    } finally {
      setResetting(false);
    }
  }, [load]);

  return { leaderboard, lastReset, loading, resetting, resetError, resetWeek, selected, setSelected };
}
