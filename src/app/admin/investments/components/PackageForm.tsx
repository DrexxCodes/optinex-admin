'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function PackageForm({ onCreate }: { onCreate: (pkg: { name: string; price: number; duration: string; details: string[] }) => Promise<{ ok: boolean; error?: string }> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setPrice('');
    setDuration('');
    setDetails(['']);
    setError(null);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await onCreate({ name, price: Number(price), duration, details: details.filter((d) => d.trim()) });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not create package.');
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
        <Plus size={16} /> New Package
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink">New Package</h3>
        <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink/70">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Package name" className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price (₦)" className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (e.g. 30 days)" className="rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-sm outline-none focus:border-brand-500" />
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Details / Benefits</span>
        {details.map((d, i) => (
          <input
            key={i}
            value={d}
            onChange={(e) => setDetails((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
            placeholder={`Benefit ${i + 1}`}
            className="mb-2 w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
        ))}
        <button onClick={() => setDetails((prev) => [...prev, ''])} className="text-xs font-semibold text-brand-500">
          + Add another benefit
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={saving || !name || !price || !duration}
        className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create Package'}
      </button>
    </div>
  );
}
