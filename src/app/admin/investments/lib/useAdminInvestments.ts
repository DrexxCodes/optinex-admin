'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type AdminPackage = { id: string; name: string; price: number; duration: string; details: string[]; active: boolean };
export type BankSettings = { bankName: string; accountNumber: string; accountName: string };
export type InvestmentRequest = {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  packageName: string;
  amount: number;
  receiptUrl: string;
  reference: string;
  createdAt: string | null;
};

export function useAdminInvestments() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [bank, setBank] = useState<BankSettings>({ bankName: '', accountNumber: '', accountName: '' });
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pkgRes, bankRes, reqRes] = await Promise.all([
      authFetch('/api/admin/investments/packages'),
      authFetch('/api/admin/investments/bank'),
      authFetch('/api/admin/investments/requests')
    ]);
    if (pkgRes.ok) setPackages((await pkgRes.json()).packages);
    if (bankRes.ok) setBank(await bankRes.json());
    if (reqRes.ok) setRequests((await reqRes.json()).requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveBank = useCallback(async (next: BankSettings) => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/investments/bank', { method: 'PUT', body: JSON.stringify(next) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save bank details.');
        return false;
      }
      setBank(next);
      return true;
    } finally {
      setSaving(false);
    }
  }, []);

  const createPackage = useCallback(
    async (pkg: { name: string; price: number; duration: string; details: string[] }) => {
      const res = await authFetch('/api/admin/investments/packages', { method: 'POST', body: JSON.stringify(pkg) });
      const data = await res.json();
      if (res.ok) await load();
      return { ok: res.ok, error: data.error };
    },
    [load]
  );

  const updatePackage = useCallback(async (id: string, update: Partial<AdminPackage>) => {
    await authFetch(`/api/admin/investments/packages/${id}`, { method: 'PATCH', body: JSON.stringify(update) });
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...update } : p)));
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    await authFetch(`/api/admin/investments/packages/${id}`, { method: 'DELETE' });
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resolveRequest = useCallback(async (id: string, action: 'approve' | 'reject') => {
    await authFetch(`/api/admin/investments/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { packages, bank, requests, loading, saving, error, saveBank, createPackage, updatePackage, deletePackage, resolveRequest };
}
