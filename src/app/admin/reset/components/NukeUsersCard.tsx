'use client';

import { useState } from 'react';
import { Skull } from 'lucide-react';
import { formatResetTime } from '../lib/formatResetTime';
import NukeUsersModal from './NukeUsersModal';
import type { NukeResult } from '../lib/useAdminReset';

export default function NukeUsersCard({
  lastReset,
  nuking,
  nukeResult,
  onNuke
}: {
  lastReset: string | null;
  nuking: boolean;
  nukeResult: NukeResult | null;
  onNuke: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onNuke();
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border-2 border-red-500/15 bg-red-50/40 p-5 shadow-sm sm:col-span-2">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
          <Skull size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Reset Users</p>
          <p className="mt-0.5 text-xs text-ink/50">
            Wipes every non-admin user, their wallets and history, referrals and game leaderboards — across Firestore, Redis and Auth.
            Nothing to do with the categories above; this clears the users themselves.
          </p>
          <p className="mt-1 text-xs text-ink/35">{formatResetTime(lastReset)}</p>
        </div>
      </div>

      {nukeResult?.ok && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
          Wiped {nukeResult.usersDeleted?.toLocaleString()} user{nukeResult.usersDeleted === 1 ? '' : 's'}
          {typeof nukeResult.adminsPreserved === 'number' && nukeResult.adminsPreserved > 0
            ? ` (kept ${nukeResult.adminsPreserved} admin account${nukeResult.adminsPreserved === 1 ? '' : 's'})`
            : ''}
          .
        </p>
      )}
      {nukeResult && !nukeResult.ok && (
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700">{nukeResult.error ?? 'Could not complete the wipe.'}</p>
      )}

      <button
        onClick={() => setOpen(true)}
        disabled={nuking}
        className="mt-4 w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {nuking ? 'Wiping everything…' : 'Reset Users'}
      </button>

      {open && <NukeUsersModal nuking={nuking} onConfirm={handleConfirm} onClose={() => setOpen(false)} />}
    </div>
  );
}
