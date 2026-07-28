'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { WithdrawalRequest } from '../lib/useAdminWithdrawals';

function RequestRow({ r, onResolve }: { r: WithdrawalRequest; onResolve: (id: string, action: 'approve' | 'reject') => Promise<void> }) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const run = async (action: 'approve' | 'reject') => {
    setBusy(action);
    await onResolve(r.id, action);
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">
          {r.fullName} <span className="font-normal text-ink/40">@{r.username}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink/50">
          {r.payoutMethod.bankName} · {r.payoutMethod.accountNumber} · {r.payoutMethod.accountName}
        </p>
        <p className="mt-0.5 text-xs text-ink/40">Ref: {r.reference}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p className="mr-1 font-display text-sm font-bold text-ink">₦{r.amount.toLocaleString()}</p>
        <button
          onClick={() => run('approve')}
          disabled={busy !== null}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
          aria-label="Mark as paid"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => run('reject')}
          disabled={busy !== null}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
          aria-label="Reject and refund"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default function WithdrawalRequestsList({
  requests,
  onResolve
}: {
  requests: WithdrawalRequest[];
  onResolve: (id: string, action: 'approve' | 'reject') => Promise<void>;
}) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold text-ink">Pending Requests ({requests.length})</h2>
      <p className="mt-0.5 text-xs text-ink/40">Approve once you've sent the transfer — reject refunds the wallet.</p>

      {requests.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">Nothing pending — you're all caught up.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {requests.map((r) => (
            <RequestRow key={r.id} r={r} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
