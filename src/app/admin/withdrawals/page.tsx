'use client';

import { useAdminWithdrawals } from './lib/useAdminWithdrawals';
import WithdrawalSettingsForm from './components/WithdrawalSettingsForm';
import WithdrawalRequestsList from './components/WithdrawalRequestsList';

export default function AdminWithdrawalsPage() {
  const { enabledDate, requests, loading, saving, error, saveEnabledDate, resolveRequest } = useAdminWithdrawals();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Withdrawals</h1>
      <p className="mt-1 text-sm text-ink/60">Control when withdrawals open and settle pending requests.</p>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <div className="mt-5">
            <WithdrawalSettingsForm enabledDate={enabledDate} saving={saving} error={error} onSave={saveEnabledDate} />
          </div>
          <WithdrawalRequestsList requests={requests} onResolve={resolveRequest} />
        </>
      )}
    </div>
  );
}
