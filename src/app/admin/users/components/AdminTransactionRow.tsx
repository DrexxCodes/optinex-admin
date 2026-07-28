import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { AdminUserTransaction } from '../lib/useAdminUsers';

export default function AdminTransactionRow({ transaction: t }: { transaction: AdminUserTransaction }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.02] p-3.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          t.txnType === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
        }`}
      >
        {t.txnType === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium capitalize text-ink">{t.txnName}</p>
        <p className="truncate text-xs text-ink/40">
          {t.txnRef}
          {t.timestamp && ` · ${new Date(t.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${t.txnType === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
        {t.txnType === 'credit' ? '+' : '-'}₦{t.amount.toLocaleString()}
      </p>
    </div>
  );
}
