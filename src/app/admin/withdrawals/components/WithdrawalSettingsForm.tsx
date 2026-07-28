'use client';

import { useState } from 'react';

export default function WithdrawalSettingsForm({
  enabledDate,
  saving,
  error,
  onSave
}: {
  enabledDate: string | null;
  saving: boolean;
  error: string | null;
  onSave: (date: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(enabledDate ? enabledDate.slice(0, 16) : '');
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    if (!value) return;
    const ok = await onSave(new Date(value).toISOString());
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold text-ink">Withdrawal Availability</h2>
      <p className="mt-1 text-xs text-ink/50">Users can request withdrawals starting from this date/time.</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setSaved(false);
            setValue(e.target.value);
          }}
          className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
        />
        <button
          onClick={submit}
          disabled={saving || !value}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
