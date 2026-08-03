'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type ResetCategory = 'financial' | 'checkin' | 'signup' | 'game' | 'referral' | 'withdrawals';
export type CasinoGameId = 'brick-slasher' | 'reaction-tap' | 'stack-tower' | 'endless-runner';

export type ResetLog = {
  financial: string | null;
  checkin: string | null;
  signup: string | null;
  referral: string | null;
  withdrawals: string | null;
  game: Record<CasinoGameId | 'all', string | null>;
};

export function useAdminReset() {
  const [resetLog, setResetLog] = useState<ResetLog | null>(null);
  const [loadingLog, setLoadingLog] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null); // category, or `game:<id>` for a specific game
  const [result, setResult] = useState<{ key: string; ok: boolean; error?: string } | null>(null);

  const loadLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await authFetch('/api/admin/reset');
      if (res.ok) setResetLog((await res.json()).resetLog);
    } finally {
      setLoadingLog(false);
    }
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const reset = useCallback(async (category: ResetCategory, gameId?: CasinoGameId) => {
    const key = category === 'game' ? `game:${gameId ?? 'all'}` : category;
    setResetting(key);
    setResult(null);
    try {
      const res = await authFetch('/api/admin/reset', { method: 'POST', body: JSON.stringify({ category, gameId }) });
      const data = await res.json();
      setResult({ key, ok: res.ok, error: data.error });
      if (res.ok && data.resetLog) setResetLog(data.resetLog);
      return res.ok;
    } finally {
      setResetting(null);
    }
  }, []);

  return { reset, resetting, result, resetLog, loadingLog };
}
