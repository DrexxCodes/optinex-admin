'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import { LOAN_STAGE_LABELS, nextLoanStage, type LoanStage, type LoanTimelineStep } from '@/lib/loans/config';
import type { AdminLoan } from '../lib/useAdminLoans';
import LoanTimeline from './LoanTimeline';

const STATUS_STYLES: Record<LoanStage, string> = {
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-sky-50 text-sky-700',
  approved: 'bg-emerald-50 text-emerald-700',
  disbursed: 'bg-brand-50 text-brand-600'
};

const ACTION_LABELS: Record<LoanStage, string> = {
  pending: '',
  processing: 'Start processing',
  approved: 'Approve',
  disbursed: 'Mark as disbursed'
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — nothing to do */
        }
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
      aria-label="Copy account number"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function LoanRow({
  loan,
  loadTimeline,
  onAdvance
}: {
  loan: AdminLoan;
  loadTimeline: (id: string) => Promise<LoanTimelineStep[] | null>;
  onAdvance: (loan: AdminLoan, to: LoanStage) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [timeline, setTimeline] = useState<LoanTimelineStep[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = nextLoanStage(loan.status);

  const toggle = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening) setTimeline(await loadTimeline(loan.id));
  };

  const advance = async () => {
    if (!next) return;
    // Timeline entries are permanent, so make the admin confirm each step.
    const ok = window.confirm(
      `Move ${loan.fullName}'s ₦${loan.amount.toLocaleString()} application to "${LOAN_STAGE_LABELS[next]}"?\n\nThis is recorded permanently and can't be undone.`
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const err = await onAdvance(loan, next);
    setBusy(false);
    if (err) setError(err);
    else setTimeline(await loadTimeline(loan.id));
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={toggle} className="flex min-w-0 flex-1 items-start gap-2 text-left" aria-expanded={open}>
          <ChevronDown size={16} className={clsx('mt-0.5 shrink-0 text-ink/30 transition', open && 'rotate-180')} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {loan.fullName} <span className="font-normal text-ink/40">@{loan.username}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink/50">
              {loan.bankAccount.bankName} · {loan.bankAccount.accountNumber} · {loan.bankAccount.accountName}
            </p>
            <p className="mt-0.5 text-xs text-ink/40">
              Ref: {loan.reference}
              {loan.createdAt && ` · Applied ${new Date(loan.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-2 pl-6 sm:pl-0">
          <p className="mr-1 font-display text-sm font-bold text-ink">₦{loan.amount.toLocaleString()}</p>
          <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', STATUS_STYLES[loan.status])}>
            {LOAN_STAGE_LABELS[loan.status]}
          </span>
          {next && (
            <button
              onClick={advance}
              disabled={busy}
              className="rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? 'Saving…' : ACTION_LABELS[next]}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mx-4 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {open && (
        <div className="border-t border-ink/5 px-4 pb-5 pt-4">
          <div className="mb-4 flex items-center gap-1 text-xs text-ink/50">
            Account number: <span className="font-semibold text-ink/70">{loan.bankAccount.accountNumber}</span>
            <CopyButton value={loan.bankAccount.accountNumber} />
          </div>
          {timeline ? <LoanTimeline steps={timeline} /> : <div className="h-24 animate-pulse rounded-xl bg-ink/5" />}
        </div>
      )}
    </div>
  );
}

export default function LoanList({
  loans,
  loadTimeline,
  onAdvance
}: {
  loans: AdminLoan[];
  loadTimeline: (id: string) => Promise<LoanTimelineStep[] | null>;
  onAdvance: (loan: AdminLoan, to: LoanStage) => Promise<string | null>;
}) {
  if (loans.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">No applications here.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {loans.map((loan) => (
        <LoanRow key={loan.id} loan={loan} loadTimeline={loadTimeline} onAdvance={onAdvance} />
      ))}
    </div>
  );
}
