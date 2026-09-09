'use client';

import { useEffect, useState } from 'react';
import { X, Skull } from 'lucide-react';

const CONFIRM_PHRASE = 'DELETE EVERYTHING';

export default function NukeUsersModal({
  nuking,
  onConfirm,
  onClose
}: {
  nuking: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const canConfirm = typed === CONFIRM_PHRASE && !nuking;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !nuking) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, nuking]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !nuking && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border-2 border-red-500/20 bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Skull size={18} />
          </span>
          {!nuking && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 transition hover:bg-ink/10 hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <p className="mt-3 text-base font-bold text-ink">Reset Users</p>
        <p className="mt-2 text-sm font-semibold text-red-600">
          This is a destructive AND IRREVERSIBLE action that will clear ALL users, their data, referrals and game data.
        </p>
        <p className="mt-2 text-xs text-ink/50">
          Concretely: every non-admin user, their wallets, transactions, check-ins, spins, completed tasks, investments, withdrawals,
          upgrade requests, referral links and leaderboard standing — gone, across Firestore, Redis and Auth. Admin accounts are kept so
          you don&apos;t lock yourself out. Is this what you want?
        </p>

        <label className="mt-4 block text-xs font-medium text-ink/60">
          Type <span className="font-mono font-bold text-red-600">{CONFIRM_PHRASE}</span> to confirm
        </label>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={nuking}
          autoFocus
          placeholder={CONFIRM_PHRASE}
          className="mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2.5 text-sm text-ink outline-none focus:border-red-400 disabled:opacity-50"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={nuking}
            className="flex-1 rounded-xl bg-ink/5 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nuking ? 'Wiping everything…' : 'Nuke everything'}
          </button>
        </div>
      </div>
    </div>
  );
}
