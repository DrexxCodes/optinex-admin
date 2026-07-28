'use client';

import { useState } from 'react';
import { ShieldCheck, Shield } from 'lucide-react';
import type { AdminUser, AdminUserTransaction } from '../lib/useAdminUsers';
import WalletTopUpForm from './WalletTopUpForm';
import AdminTransactionRow from './AdminTransactionRow';

export default function UserDetail({
  user,
  onToggleAdmin,
  onCredit,
  transactions,
  txnsLoading,
  txnsLoadingMore,
  txnsHasMore,
  onLoadMoreTransactions
}: {
  user: AdminUser;
  onToggleAdmin: (uid: string, makeAdmin: boolean) => Promise<boolean>;
  onCredit: (amount: number, note: string) => Promise<{ ok: boolean; error?: string }>;
  transactions: AdminUserTransaction[];
  txnsLoading: boolean;
  txnsLoadingMore: boolean;
  txnsHasMore: boolean;
  onLoadMoreTransactions: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const toggle = async () => {
    setToggling(true);
    setToggleError(null);
    const ok = await onToggleAdmin(user.uid, !user.admin);
    if (!ok) setToggleError("Couldn't update that user — you may not be able to remove your own admin access.");
    setToggling(false);
  };

  return (
    <div className="mt-3 space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-ink">{user.fullName}</p>
              {user.accountTier === 'upgraded' && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">Upgraded</span>
              )}
            </div>
            <p className="truncate text-sm text-ink/50">
              @{user.username} · {user.email}
            </p>
            <p className="mt-1 text-xs text-ink/40">
              {user.packageStatus} package
              {user.createdAt && ` · joined ${new Date(user.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="font-display text-lg font-bold text-ink">₦{user.walletAmount.toLocaleString()}</p>
              <p className="text-xs text-ink/40">Wallet balance</p>
            </div>
            <button
              onClick={toggle}
              disabled={toggling}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                user.admin ? 'bg-brand-50 text-brand-600 hover:bg-brand-100' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {user.admin ? <ShieldCheck size={14} /> : <Shield size={14} />}
              {user.admin ? 'Admin' : 'Make Admin'}
            </button>
          </div>
        </div>

        {toggleError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{toggleError}</p>}

        <div className="mt-4">
          <WalletTopUpForm onCredit={onCredit} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-bold text-ink">Transaction History</h3>

        {txnsLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink/[0.03]" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">No wallet transactions yet.</p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {transactions.map((t) => (
                <AdminTransactionRow key={t.id} transaction={t} />
              ))}
            </div>
            {txnsHasMore && (
              <button
                onClick={onLoadMoreTransactions}
                disabled={txnsLoadingMore}
                className="mt-3 w-full rounded-xl bg-ink/5 py-2.5 text-xs font-semibold text-ink/60 transition hover:bg-ink/10 disabled:opacity-50"
              >
                {txnsLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
