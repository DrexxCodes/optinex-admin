'use client';

import { useState } from 'react';
import type { PushDraft } from '../lib/useAdminPush';
import { EMPTY_DRAFT } from '../lib/useAdminPush';

export default function PushForm({
  sending,
  error,
  onSend
}: {
  sending: boolean;
  error: string | null;
  onSend: (draft: PushDraft) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<PushDraft>(EMPTY_DRAFT);
  const [sent, setSent] = useState(false);

  const set = (key: keyof PushDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSent(false);
    setDraft((d) => ({ ...d, [key]: e.target.value }));
  };

  const submit = async () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    const confirmed = window.confirm('Send this push notification to every user with notifications enabled?');
    if (!confirmed) return;

    const ok = await onSend(draft);
    if (ok) {
      setDraft(EMPTY_DRAFT);
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-display text-sm font-bold text-ink">New Push Notification</h2>
        <p className="mt-1 text-xs text-ink/50">Delivered instantly to every device that has notifications enabled.</p>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Title</span>
          <input
            value={draft.title}
            onChange={set('title')}
            placeholder="e.g. Weekend bonus is live!"
            maxLength={65}
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Body</span>
          <textarea
            value={draft.body}
            onChange={set('body')}
            rows={3}
            placeholder="What do you want users to know?"
            maxLength={180}
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Link (optional)</span>
          <input
            value={draft.link}
            onChange={set('link')}
            placeholder="/investment"
            className="w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
          />
          <span className="mt-1 block text-xs text-ink/40">Where tapping the notification takes users. Defaults to the dashboard.</span>
        </label>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={sending || !draft.title.trim() || !draft.body.trim()}
        className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send to All Users'}
      </button>
    </div>
  );
}
