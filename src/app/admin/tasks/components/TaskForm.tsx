'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function TaskForm({
  onCreate
}: {
  onCreate: (task: { name: string; details: string; buttonLabel: string; link: string; reward: number }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [link, setLink] = useState('');
  const [reward, setReward] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDetails('');
    setButtonLabel('');
    setLink('');
    setReward('');
    setError(null);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await onCreate({ name, details, buttonLabel: buttonLabel.trim(), link: link.trim(), reward: Number(reward) });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not create task.');
      return;
    }
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <Plus size={16} /> New Task
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink">New Task</h3>
        <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink/70">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          type="number"
          placeholder="Reward (₦)"
          className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Task details / instructions"
        rows={2}
        className="mt-3 w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          value={buttonLabel}
          onChange={(e) => setButtonLabel(e.target.value)}
          placeholder="Button label (optional)"
          className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (optional)"
          className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <p className="mt-1.5 text-xs text-ink/40">
        Leave button label and link blank to show a plain &quot;Complete&quot; button with no outbound link.
      </p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={saving || !name || !details || !reward}
        className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create Task'}
      </button>
    </div>
  );
}
