'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type WithdrawalRequest = {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  amount: number;
  payoutMethod: { accountNumber: string; bankName: string; accountName: string };
  reference: string;
  createdAt: string | null;
};

export function useAdminWithdrawals() {
  const [enabledDate, setEnabledDate] = useState<string | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [settingsRes, requestsRes] = await Promise.all([
      authFetch('/api/admin/withdrawals/settings'),
      authFetch('/api/admin/withdrawals/requests')
    ]);
    if (settingsRes.ok) setEnabledDate((await settingsRes.json()).enabledDate);
    if (requestsRes.ok) setRequests((await requestsRes.json()).requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveEnabledDate = useCallback(async (date: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/withdrawals/settings', { method: 'PUT', body: JSON.stringify({ enabledDate: date }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save.');
        return false;
      }
      setEnabledDate(date);
      return true;
    } finally {
      setSaving(false);
    }
  }, []);

  const resolveRequest = useCallback(async (id: string, action: 'approve' | 'reject') => {
    await authFetch(`/api/admin/withdrawals/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { enabledDate, requests, loading, saving, error, saveEnabledDate, resolveRequest };
}
