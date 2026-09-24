import { BadgeCheck, Ban, ExternalLink, Package } from 'lucide-react';
import type { AdminUserSubscription, SubscriptionStatus } from '../lib/useAdminUsers';

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-600' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-600' },
  failed: { label: 'Rejected', className: 'bg-red-50 text-red-500' },
  revoked: { label: 'Revoked', className: 'bg-ink/5 text-ink/50' }
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function SubscriptionRow({
  subscription: s,
  busy,
  onRevoke
}: {
  subscription: AdminUserSubscription;
  busy: boolean;
  onRevoke: () => void;
}) {
  const status = STATUS_STYLES[s.status];
  const isUpgrade = s.kind === 'upgrade';

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-ink/[0.02] p-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          {isUpgrade ? <BadgeCheck size={16} /> : <Package size={16} />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-ink">{s.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
            {s.status === 'active' && !isUpgrade && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.current ? 'bg-brand-50 text-brand-600' : 'bg-ink/5 text-ink/40'}`}
                title={s.current ? "This is the user's live package" : 'A newer package has since replaced this one'}
              >
                {s.current ? 'Current' : 'Replaced'}
              </span>
            )}
            {s.expired && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500">Expired</span>}
          </div>
          <p className="truncate text-xs text-ink/40">
            Ref: {s.reference}
            {s.createdAt && ` · submitted ${formatDate(s.createdAt)}`}
            {s.expiresAt && ` · ${s.expired ? 'expired' : 'expires'} ${formatDate(s.expiresAt)}`}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <p className="mr-1 font-display text-sm font-bold text-ink">₦{s.amount.toLocaleString()}</p>
        {s.receiptUrl && (
          <a
            href={s.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60 transition hover:bg-ink/10"
            aria-label="View receipt"
          >
            <ExternalLink size={15} />
          </a>
        )}
        {s.status === 'active' && (
          <button
            onClick={onRevoke}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Ban size={14} />
            {busy ? 'Working…' : isUpgrade ? 'Cancel upgrade' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
}
