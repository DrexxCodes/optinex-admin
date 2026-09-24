'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type AdminUser = {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  walletAmount: number;
  packageStatus: string;
  accountTier: 'standard' | 'upgraded';
  admin: boolean;
  createdAt: string | null;
};

export type AdminUserTransaction = {
  id: string;
  txnType: 'credit' | 'debit';
  txnName: string;
  amount: number;
  txnRef: string;
  timestamp: string | null;
};

export type SubscriptionStatus = 'pending' | 'active' | 'failed' | 'revoked';

// One row per package investment or account upgrade the user has ever bought.
// `current` = it's what's live on the profile right now (for a package: the
// user's current package; for an upgrade: an active upgrade).
export type AdminUserSubscription = {
  id: string;
  kind: 'package' | 'upgrade';
  name: string;
  amount: number;
  reference: string;
  receiptUrl: string;
  status: SubscriptionStatus;
  current: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string | null;
};

const PAGE_SIZE = 20;

export function useAdminUsers() {
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<AdminUserTransaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsLoadingMore, setTxnsLoadingMore] = useState(false);
  const [txnsHasMore, setTxnsHasMore] = useState(false);
  const [txnsCursor, setTxnsCursor] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<AdminUserSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const loadSubscriptions = useCallback(async (uid: string) => {
    setSubsLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${uid}/subscriptions`);
      if (res.ok) setSubscriptions((await res.json()).subscriptions);
    } finally {
      setSubsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (uid: string) => {
    setTxnsLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${uid}/transactions?limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTxnsHasMore(data.hasMore);
        setTxnsCursor(data.nextCursor);
      }
    } finally {
      setTxnsLoading(false);
    }
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    if (!user || !txnsCursor || txnsLoadingMore) return;
    setTxnsLoadingMore(true);
    try {
      const res = await authFetch(`/api/admin/users/${user.uid}/transactions?limit=${PAGE_SIZE}&cursor=${txnsCursor}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => [...prev, ...data.transactions]);
        setTxnsHasMore(data.hasMore);
        setTxnsCursor(data.nextCursor);
      }
    } finally {
      setTxnsLoadingMore(false);
    }
  }, [user, txnsCursor, txnsLoadingMore]);

  const search = useCallback(async () => {
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setSearchError(null);
    setUser(null);
    setTransactions([]);
    setSubscriptions([]);
    try {
      const res = await authFetch(`/api/admin/users?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? 'Could not find that user.');
        return;
      }
      setUser(data.user);
      await Promise.all([loadTransactions(data.user.uid), loadSubscriptions(data.user.uid)]);
    } finally {
      setSearching(false);
    }
  }, [query, loadTransactions, loadSubscriptions]);

  const toggleAdmin = useCallback(async (uid: string, makeAdmin: boolean) => {
    const res = await authFetch(`/api/admin/users/${uid}`, { method: 'PATCH', body: JSON.stringify({ admin: makeAdmin }) });
    if (res.ok) setUser((prev) => (prev && prev.uid === uid ? { ...prev, admin: makeAdmin } : prev));
    return res.ok;
  }, []);

  const creditWallet = useCallback(
    async (amount: number, note: string) => {
      if (!user) return { ok: false, error: 'No user selected.' };
      const res = await authFetch(`/api/admin/users/${user.uid}/wallet`, { method: 'POST', body: JSON.stringify({ amount, note }) });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Could not fund wallet.' };
      setUser((prev) => (prev ? { ...prev, walletAmount: data.walletAmount } : prev));
      await loadTransactions(user.uid);
      return { ok: true };
    },
    [user, loadTransactions]
  );

  // Cancels an upgrade / revokes a package. The API returns the user's new
  // packageStatus (package) or accountTier (upgrade) so the header badge
  // updates without re-searching; the list is then reloaded from the server.
  const revokeSubscription = useCallback(
    async (sub: AdminUserSubscription) => {
      if (!user) return { ok: false, error: 'No user selected.' };
      const res = await authFetch(`/api/admin/users/${user.uid}/subscriptions/${sub.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ kind: sub.kind })
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Could not revoke that subscription.' };
      setUser((prev) =>
        prev && prev.uid === user.uid
          ? { ...prev, packageStatus: data.packageStatus ?? prev.packageStatus, accountTier: data.accountTier ?? prev.accountTier }
          : prev
      );
      await loadSubscriptions(user.uid);
      return { ok: true };
    },
    [user, loadSubscriptions]
  );

  return {
    query,
    setQuery,
    user,
    searching,
    searchError,
    search,
    toggleAdmin,
    creditWallet,
    subscriptions,
    subsLoading,
    revokeSubscription,
    transactions,
    txnsLoading,
    txnsLoadingMore,
    txnsHasMore,
    loadMoreTransactions
  };
}
