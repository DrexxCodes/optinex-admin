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

      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700">
            <span className="text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Approval updates user profile</p>
            <p className="mt-1 text-xs text-blue-800">
              When you approve an upgrade request, the user&apos;s account tier will be automatically updated to &apos;upgraded&apos; in their profile.
            </p>
          </div>
        </div>
      </div>

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
