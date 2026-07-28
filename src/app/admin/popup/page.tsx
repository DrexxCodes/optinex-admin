'use client';

import { useEffect, useState } from 'react';
import { useAdminPopup, type PopupConfig } from './lib/useAdminPopup';
import PopupForm from './components/PopupForm';
import PopupPreview from './components/PopupPreview';

export default function AdminPopupPage() {
  const { config, loading, saving, error, save } = useAdminPopup();
  const [draft, setDraft] = useState<PopupConfig>(config);

  useEffect(() => setDraft(config), [config]);

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Dashboard Notification</h1>
      <p className="mt-1 text-sm text-ink/60">Create a one-time popup notification users see when they open their dashboard.</p>

      {loading ? (
        <div className="mt-5 h-80 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <PopupForm config={draft} saving={saving} error={error} onSave={save} onChange={setDraft} />
          <PopupPreview config={draft} />
        </div>
      )}
    </div>
  );
}
