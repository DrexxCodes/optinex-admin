'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type ResetCategory = 'financial' | 'checkin' | 'signup' | 'game';

export function useAdminReset() {
  const [resetting, setResetting] = useState<ResetCategory | null>(null);
  const [result, setResult] = useState<{ category: ResetCategory; ok: boolean; error?: string } | null>(null);

  const reset = async (category: ResetCategory) => {
    setResetting(category);
    setResult(null);
    try {
      const res = await authFetch('/api/admin/reset', { method: 'POST', body: JSON.stringify({ category }) });
      const data = await res.json();
      setResult({ category, ok: res.ok, error: data.error });
      return res.ok;
    } finally {
      setResetting(null);
    }
  };

  return { reset, resetting, result };
}
