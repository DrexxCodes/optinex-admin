'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type UpgradeSettings = { price: number | null; bankName: string; accountNumber: string; accountName: string };
export type UpgradeRequest = {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  amount: number;
  receiptUrl: string;
  reference: string;
  createdAt: string | null;
};

export function useAdminUpgrade() {
  const [settings, setSettings] = useState<UpgradeSettings>({ price: null, bankName: '', accountNumber: '', accountName: '' });
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [settingsRes, requestsRes] = await Promise.all([
      authFetch('/api/admin/upgrade/settings'),
      authFetch('/api/admin/upgrade/requests')
    ]);
    if (settingsRes.ok) setSettings(await settingsRes.json());
    if (requestsRes.ok) setRequests((await requestsRes.json()).requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = useCallback(async (next: UpgradeSettings) => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/upgrade/settings', { method: 'PUT', body: JSON.stringify(next) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save settings.');
        return false;
      }
      setSettings(next);
      return true;
    } finally {
      setSaving(false);
    }
  }, []);

  const resolveRequest = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      await authFetch(`/api/admin/upgrade/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  return { settings, requests, loading, saving, error, saveSettings, resolveRequest };
}
