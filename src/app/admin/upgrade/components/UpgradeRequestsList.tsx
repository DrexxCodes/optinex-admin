import PendingRequestCard from '../../components/PendingRequestCard';
import type { UpgradeRequest } from '../lib/useAdminUpgrade';

export default function UpgradeRequestsList({
  requests,
  onResolve
}: {
  requests: UpgradeRequest[];
  onResolve: (id: string, action: 'approve' | 'reject') => Promise<void>;
}) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold text-ink">Pending Requests ({requests.length})</h2>

      {requests.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">Nothing pending — you're all caught up.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {requests.map((r) => (
            <PendingRequestCard
              key={r.id}
              title={r.fullName}
              subtitle={`@${r.username}`}
              amount={r.amount}
              reference={r.reference}
              receiptUrl={r.receiptUrl}
              onApprove={() => onResolve(r.id, 'approve')}
              onReject={() => onResolve(r.id, 'reject')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
