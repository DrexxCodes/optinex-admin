'use client';

import { useAdminInvestments } from './lib/useAdminInvestments';
import BankSettingsForm from './components/BankSettingsForm';
import PackageForm from './components/PackageForm';
import PackageList from './components/PackageList';
import InvestmentRequestsList from './components/InvestmentRequestsList';

export default function AdminInvestmentsPage() {
  const { packages, bank, requests, loading, saving, error, saveBank, createPackage, updatePackage, deletePackage, resolveRequest } =
    useAdminInvestments();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Investments</h1>
      <p className="mt-1 text-sm text-ink/60">Manage packages, the payment account, and verify pending investments.</p>

      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700">
            <span className="text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Approval updates user profile</p>
            <p className="mt-1 text-xs text-blue-800">
              When you approve an investment request, the user&apos;s package status and investment package will be automatically updated in their profile.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <div className="mt-5">
            <BankSettingsForm bank={bank} saving={saving} error={error} onSave={saveBank} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-ink">Packages</h2>
              <PackageForm onCreate={createPackage} />
            </div>
            <PackageList
              packages={packages}
              onToggleActive={(id, active) => updatePackage(id, { active })}
              onDelete={deletePackage}
            />
          </div>

          <InvestmentRequestsList requests={requests} onResolve={resolveRequest} />
        </>
      )}
    </div>
  );
}
