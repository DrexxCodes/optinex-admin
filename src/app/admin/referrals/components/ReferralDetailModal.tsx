'use client';

import { useEffect } from 'react';
import { X, Users2, TrendingUp, Wallet } from 'lucide-react';
import type { ReferralLeaderboardEntry } from '../lib/useAdminReferrals';

export default function ReferralDetailModal({
  entry,
  onClose
}: {
  entry: ReferralLeaderboardEntry;
  onClose: () => void;
}) {
  // Esc to close, and lock background scroll while open — consistent with
  // how the tour overlay behaves elsewhere in the shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{entry.fullName}</p>
            <p className="truncate text-sm text-ink/40">@{entry.username || 'user'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 transition hover:bg-ink/10 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">Rank #{entry.rank}</span>
          <span className="text-xs text-ink/40">this week</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink/[0.03] p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-ink/50 shadow-sm">
              <Users2 size={15} />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-ink">{entry.weeklyReferrals.toLocaleString()}</p>
            <p className="text-xs text-ink/45">Referrals this week</p>
          </div>

          <div className="rounded-2xl bg-ink/[0.03] p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-ink/50 shadow-sm">
              <TrendingUp size={15} />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-ink">{entry.allTimeReferrals.toLocaleString()}</p>
            <p className="text-xs text-ink/45">All-time referrals</p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Wallet size={15} />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-emerald-700">₦{entry.weeklyIncome.toLocaleString()}</p>
            <p className="text-xs text-emerald-600/70">Income this week</p>
          </div>

          <div className="rounded-2xl bg-ink/[0.03] p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-ink/50 shadow-sm">
              <Wallet size={15} />
            </span>
            <p className="mt-3 font-display text-xl font-bold text-ink">₦{entry.allTimeIncome.toLocaleString()}</p>
            <p className="text-xs text-ink/45">All-time income</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-ink/35">₦1,000 credited per referral · weekly count resets, all-time never does</p>
      </div>
    </div>
  );
}
