'use client';

import { useState } from 'react';
import { Check, X, ExternalLink } from 'lucide-react';

export default function PendingRequestCard({
  title,
  subtitle,
  amount,
  reference,
  receiptUrl,
  onApprove,
  onReject
}: {
  title: string;
  subtitle?: string;
  amount: number;
  reference: string;
  receiptUrl?: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const run = async (action: 'approve' | 'reject', fn: () => Promise<void>) => {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-ink/50">{subtitle}</p>}
        <p className="mt-0.5 text-xs text-ink/40">Ref: {reference}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p className="mr-1 font-display text-sm font-bold text-ink">₦{amount.toLocaleString()}</p>
        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60 transition hover:bg-ink/10"
            aria-label="View receipt"
          >
            <ExternalLink size={15} />
          </a>
        )}
        <button
          onClick={() => run('approve', onApprove)}
          disabled={busy !== null}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
          aria-label="Approve"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => run('reject', onReject)}
          disabled={busy !== null}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
          aria-label="Reject"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
