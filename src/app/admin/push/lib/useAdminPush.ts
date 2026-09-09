'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type PushDraft = {
  title: string;
  body: string;
  link: string;
};

export type PushHistoryEntry = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  sentBy: string | null;
  sentAt: number | null;
};

const EMPTY_DRAFT: PushDraft = { title: '', body: '', link: '' };

export function useAdminPush() {
  const [history, setHistory] = useState<PushHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/push');
      const data = res.ok ? await res.json() : { notifications: [] };
      setHistory(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (draft: PushDraft) => {
      setSending(true);
      setError(null);
      try {
        const res = await authFetch('/api/admin/push', { method: 'POST', body: JSON.stringify(draft) });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Could not send the push notification.');
          return false;
        }
        await refresh();
        return true;
      } finally {
        setSending(false);
      }
    },
    [refresh]
  );

  return { history, loading, sending, error, send };
}

export { EMPTY_DRAFT };
