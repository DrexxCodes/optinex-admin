'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type AdminOverviewPackage = { id: string; name: string; price: number; active: boolean; subscribers: number };
export type SignupPoint = { date: string; signups: number };
export type FinancialPeriod = { label: string; amountTotal: number; total: number };

export type AdminOverview = {
  totalUsers: number;
  freeUsers: number;
  upgradedUsers: number;
  pendingUpgrades: number;
  pendingInvestments: number;
  pendingWithdrawals: number;
  pendingWithdrawalTotal: number;
  packages: AdminOverviewPackage[];
  signups: SignupPoint[];
  financial: { daily: FinancialPeriod; monthly: FinancialPeriod; yearly: FinancialPeriod };
};

export function useAdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
