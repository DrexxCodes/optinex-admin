'use client';

import { useState } from 'react';
import type { AdminUserSubscription } from '../lib/useAdminUsers';
import SubscriptionRow from './SubscriptionRow';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'ended', label: 'Ended' }
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

// "Ended" = rejected by an admin or revoked after being active.
const matches = (s: AdminUserSubscription, f: FilterKey) =>
  f === 'all' || (f === 'ended' ? s.status === 'failed' || s.status === 'revoked' : s.status === f);

function confirmMessage(s: AdminUserSubscription) {
  if (s.kind === 'upgrade') {
    return "Cancel this account upgrade? The user goes back to a standard account immediately. This can't be undone.";
  }
  if (s.current) {
    return `Revoke ${s.name}? The user is moved back to the Free package immediately. This can't be undone.`;
  }
  return `Revoke ${s.name}? This is an earlier package, so the user's current package won't change. This can't be undone.`;
}

export default function UserSubscriptions({
  subscriptions,
  loading,
  onRevoke
}: {
  subscriptions: AdminUserSubscription[];
  loading: boolean;
  onRevoke: (sub: AdminUserSubscription) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = subscriptions.filter((s) => matches(s, filter));

  const revoke = async (s: AdminUserSubscription) => {
    if (!confirm(confirmMessage(s))) return;
    setBusyId(s.id);
    setError(null);
    const res = await onRevoke(s);
    if (!res.ok) setError(res.error ?? 'Could not revoke that subscription.');
    setBusyId(null);
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-display text-sm font-bold text-ink">Packages & Upgrades</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = subscriptions.filter((s) => matches(s, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key ? 'bg-brand-500 text-white' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink/[0.03]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-3 text-sm text-ink/40">
          {subscriptions.length === 0 ? 'This user has no packages or upgrades yet.' : 'Nothing in this view.'}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((s) => (
            <SubscriptionRow key={`${s.kind}-${s.id}`} subscription={s} busy={busyId === s.id} onRevoke={() => revoke(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
