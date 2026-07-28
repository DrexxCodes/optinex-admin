'use client';

import { useState } from 'react';
import type { UpgradeSettings } from '../lib/useAdminUpgrade';

export default function UpgradeSettingsForm({
  settings,
  saving,
  error,
  onSave
}: {
  settings: UpgradeSettings;
  saving: boolean;
  error: string | null;
  onSave: (next: UpgradeSettings) => Promise<boolean>;
}) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof UpgradeSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: key === 'price' ? Number(e.target.value) : e.target.value }));
  };

  const submit = async () => {
    const ok = await onSave(form);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold text-ink">Upgrade Pricing & Account Details</h2>
      <p className="mt-1 text-xs text-ink/50">Shown to users on the Upgrade Account page.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Price (₦)</span>
          <input
            type="number"
            value={form.price ?? ''}
            onChange={set('price')}
            placeholder="e.g. 15000"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Bank Name</span>
          <input
            value={form.bankName}
            onChange={set('bankName')}
            placeholder="e.g. GTBank"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Account Number</span>
          <input
            value={form.accountNumber}
            onChange={set('accountNumber')}
            placeholder="0123456789"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Account Name</span>
          <input
            value={form.accountName}
            onChange={set('accountName')}
            placeholder="Optinex Africa Ltd"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
      </button>
    </div>
  );
}
