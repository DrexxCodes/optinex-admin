'use client';

import { useState } from 'react';
import type { PopupConfig } from '../lib/useAdminPopup';

export default function PopupForm({
  config,
  saving,
  error,
  onSave,
  onChange
}: {
  config: PopupConfig;
  saving: boolean;
  error: string | null;
  onSave: (next: PopupConfig) => Promise<boolean>;
  onChange: (next: PopupConfig) => void;
}) {
  const [saved, setSaved] = useState(false);

  const set = (key: keyof PopupConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    onChange({ ...config, [key]: key === 'enabled' ? (e.target as HTMLInputElement).checked : e.target.value });
  };

  const submit = async () => {
    const ok = await onSave(config);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold text-ink">Dashboard Notification</h2>
          <p className="mt-1 text-xs text-ink/50">Shown once per session when a user opens their dashboard.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
          <input type="checkbox" checked={config.enabled} onChange={set('enabled')} className="h-4 w-4 accent-brand-500" />
          Enabled
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Title</span>
          <input
            value={config.title}
            onChange={set('title')}
            placeholder="e.g. New investment packages are live!"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Body</span>
          <textarea
            value={config.body}
            onChange={set('body')}
            rows={3}
            placeholder="What do you want users to know?"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Action Label (optional)</span>
            <input
              value={config.actionLabel}
              onChange={set('actionLabel')}
              placeholder="e.g. View Packages"
              className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Action Link (optional)</span>
            <input
              value={config.actionLink}
              onChange={set('actionLink')}
              placeholder="/investment"
              className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
            />
          </label>
        </div>
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
