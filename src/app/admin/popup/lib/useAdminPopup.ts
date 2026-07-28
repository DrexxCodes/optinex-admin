'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type PopupConfig = {
  enabled: boolean;
  title: string;
  body: string;
  actionLabel: string;
  actionLink: string;
};

const EMPTY: PopupConfig = { enabled: false, title: '', body: '', actionLabel: '', actionLink: '' };

export function useAdminPopup() {
  const [config, setConfig] = useState<PopupConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/admin/popup')
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: PopupConfig) => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/popup', { method: 'PUT', body: JSON.stringify(next) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save the notification.');
        return false;
      }
      setConfig(next);
      return true;
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, loading, saving, error, save };
}
