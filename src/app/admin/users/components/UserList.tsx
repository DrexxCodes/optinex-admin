'use client';

import { useState } from 'react';
import { ShieldCheck, Shield } from 'lucide-react';
import type { AdminUser } from '../lib/useAdminUsers';

export default function UserList({ users, onToggleAdmin }: { users: AdminUser[]; onToggleAdmin: (uid: string, makeAdmin: boolean) => Promise<boolean> }) {
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (u: AdminUser) => {
    setBusyUid(u.uid);
    setError(null);
    const ok = await onToggleAdmin(u.uid, !u.admin);
    if (!ok) setError("Couldn't update that user — you may not be able to remove your own admin access.");
    setBusyUid(null);
  };

  if (users.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">No users match your search.</p>;
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.uid} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">{u.fullName}</p>
                {u.accountTier === 'upgraded' && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">Upgraded</span>
                )}
              </div>
              <p className="truncate text-xs text-ink/50">
                @{u.username} · {u.email}
              </p>
              <p className="text-xs text-ink/40">
                ₦{u.walletAmount.toLocaleString()} · {u.packageStatus}
              </p>
            </div>
            <button
              onClick={() => toggle(u)}
              disabled={busyUid === u.uid}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                u.admin ? 'bg-brand-50 text-brand-600 hover:bg-brand-100' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {u.admin ? <ShieldCheck size={14} /> : <Shield size={14} />}
              {u.admin ? 'Admin' : 'Make Admin'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
