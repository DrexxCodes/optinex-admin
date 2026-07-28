import type { FinancialPeriod } from '../lib/useAdminOverview';

export default function FinancialStats({ daily, monthly, yearly }: { daily: FinancialPeriod; monthly: FinancialPeriod; yearly: FinancialPeriod }) {
  const rows = [
    { title: 'Today', period: daily },
    { title: 'This Month', period: monthly },
    { title: 'This Year', period: yearly }
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold text-ink">Financial Stats</h2>
      <p className="mt-1 text-xs text-ink/50">Money moved through the platform, from pre-aggregated analytics — no per-user reads.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {rows.map(({ title, period }) => (
          <div key={title} className="rounded-xl bg-ink/[0.02] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{title}</p>
            <p className="mt-1 font-display text-lg font-bold text-ink">₦{period.amountTotal.toLocaleString()}</p>
            <p className="text-xs text-ink/40">{period.total.toLocaleString()} events</p>
          </div>
        ))}
      </div>
    </div>
  );
}
