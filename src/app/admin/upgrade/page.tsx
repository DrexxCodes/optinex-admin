'use client';

import { useAdminUpgrade } from './lib/useAdminUpgrade';
import UpgradeSettingsForm from './components/UpgradeSettingsForm';
import UpgradeRequestsList from './components/UpgradeRequestsList';

export default function AdminUpgradePage() {
  const { settings, requests, loading, saving, error, saveSettings, resolveRequest } = useAdminUpgrade();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Upgrade Account</h1>
      <p className="mt-1 text-sm text-ink/60">Control pricing, payout details, and verify pending upgrade requests.</p>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <div className="mt-5">
            <UpgradeSettingsForm settings={settings} saving={saving} error={error} onSave={saveSettings} />
          </div>
          <UpgradeRequestsList requests={requests} onResolve={resolveRequest} />
        </>
      )}
    </div>
  );
}
