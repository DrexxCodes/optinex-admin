// Single source of truth for the loan application lifecycle. The admin app
// keeps an identical copy of this file (src/lib/loans/config.ts) — if you
// change the stages or limits here, change them there too.

// Strictly linear: an application only ever moves one step forward, never
// back and never skipping a stage.
export const LOAN_STAGES = ['pending', 'processing', 'approved', 'disbursed'] as const;
export type LoanStage = (typeof LOAN_STAGES)[number];

export const LOAN_STAGE_LABELS: Record<LoanStage, string> = {
  pending: 'Pending',
  processing: 'Processing',
  approved: 'Approved',
  disbursed: 'Disbursed'
};

export const LOAN_STAGE_HINTS: Record<LoanStage, string> = {
  pending: 'Application received and waiting for review.',
  processing: 'Our team is reviewing your application.',
  approved: 'Your loan has been approved.',
  disbursed: 'Funds have been sent to your bank account.'
};

// Whole-naira limits for a single application.
export const MIN_LOAN_AMOUNT = 1_000;
export const MAX_LOAN_AMOUNT = 5_000_000;

export function isLoanStage(value: unknown): value is LoanStage {
  return typeof value === 'string' && (LOAN_STAGES as readonly string[]).includes(value);
}

export function nextLoanStage(current: LoanStage): LoanStage | null {
  const i = LOAN_STAGES.indexOf(current);
  return i >= 0 && i < LOAN_STAGES.length - 1 ? LOAN_STAGES[i + 1] : null;
}

export type LoanActor = 'user' | 'admin';

export type LoanTimelineStep = {
  status: LoanStage;
  label: string;
  reachedAt: string | null; // ISO string, null while the stage is still ahead
  by: LoanActor | null;
};

type RawEntry = { status?: string; at?: { toDate?: () => Date } | null; by?: LoanActor };

// Turns the immutable entries in `loans/{id}/timeline` into the full four-step
// view: reached stages carry their timestamp, remaining stages are null.
export function buildLoanTimeline(entries: RawEntry[]): LoanTimelineStep[] {
  const byStage = new Map<string, RawEntry>();
  entries.forEach((e) => {
    if (e.status) byStage.set(e.status, e);
  });

  return LOAN_STAGES.map((status) => {
    const entry = byStage.get(status);
    return {
      status,
      label: LOAN_STAGE_LABELS[status],
      reachedAt: entry?.at?.toDate?.()?.toISOString?.() ?? null,
      by: entry?.by ?? null
    };
  });
}
