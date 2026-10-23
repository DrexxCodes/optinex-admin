'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import type { LoanStage, LoanTimelineStep } from '@/lib/loans/config';

export type AdminLoan = {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  amount: number;
  status: LoanStage;
  reference: string;
  bankAccount: { accountNumber: string; bankCode: string; bankName: string; accountName: string };
  createdAt: string | null;
  statusChangedAt: string | null;
};

export type StatusFilter = 'all' | LoanStage;

export function useAdminLoans() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: StatusFilter) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/loans${f === 'all' ? '' : `?status=${f}`}`);
      if (!res.ok) {
        setError('Could not load loan applications.');
        return;
      }
      const data = await res.json();
      setLoans(data.loans);
      setCounts(data.counts);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [load, filter]);

  const loadTimeline = useCallback(async (id: string): Promise<LoanTimelineStep[] | null> => {
    const res = await authFetch(`/api/admin/loans/${id}`);
    return res.ok ? (await res.json()).timeline : null;
  }, []);

  // Returns an error message, or null on success. Always reloads afterwards so
  // the list (and counts) reflect the server — including when someone else
  // already moved the application (409).
  const advance = useCallback(
    async (loan: AdminLoan, to: LoanStage): Promise<string | null> => {
      const res = await authFetch(`/api/admin/loans/${loan.id}`, { method: 'PATCH', body: JSON.stringify({ from: loan.status, to }) });
      const data = await res.json().catch(() => ({}));
      await load(filter);
      return res.ok ? null : (data.error ?? 'Could not update this application.');
    },
    [load, filter]
  );

  return { filter, setFilter, loans, counts, loading, error, loadTimeline, advance };
}
