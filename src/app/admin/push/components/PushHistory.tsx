'use client';

import type { PushHistoryEntry } from '../lib/useAdminPush';

function formatSentAt(ms: number | null) {
  if (!ms) return '';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function PushHistory({ history, loading }: { history: PushHistoryEntry[]; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold text-ink">Recently Sent</h2>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-ink/[0.04]" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">Nothing sent yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {history.map((n) => (
            <li key={n.id} className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <span className="shrink-0 text-xs text-ink/40">{formatSentAt(n.sentAt)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/60">{n.body}</p>
              {n.sentBy && <p className="mt-1.5 text-xs text-ink/40">Sent by {n.sentBy}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
