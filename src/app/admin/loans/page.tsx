'use client';

import clsx from 'clsx';
import { LOAN_STAGES, LOAN_STAGE_LABELS } from '@/lib/loans/config';
import { useAdminLoans, type StatusFilter } from './lib/useAdminLoans';
import LoanList from './components/LoanList';

export default function AdminLoansPage() {
  const { filter, setFilter, loans, counts, loading, error, loadTimeline, advance } = useAdminLoans();

  const total = LOAN_STAGES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: total },
    ...LOAN_STAGES.map((s) => ({ key: s as StatusFilter, label: LOAN_STAGE_LABELS[s], count: counts[s] ?? 0 }))
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Loans</h1>
      <p className="mt-1 text-sm text-ink/60">
        Review loan applications and move them forward: Pending → Processing → Approved → Disbursed. Each step is recorded permanently.
      </p>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={clsx(
              'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
              filter === t.key ? 'bg-brand-500 text-white' : 'bg-white text-ink/60 shadow-sm hover:text-ink'
            )}
          >
            {t.label}
            <span className={clsx('rounded-full px-1.5 text-[11px]', filter === t.key ? 'bg-white/20' : 'bg-ink/5')}>{t.count}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading && loans.length === 0 ? <div className="mt-4 h-48 animate-pulse rounded-2xl bg-white/60" /> : (
        <LoanList loans={loans} loadTimeline={loadTimeline} onAdvance={advance} />
      )}
    </div>
  );
}
