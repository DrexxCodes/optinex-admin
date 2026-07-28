'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';

export default function WalletTopUpForm({
  onCredit
}: {
  onCredit: (amount: number, note: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await onCredit(Number(amount), note.trim());
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not fund wallet.');
      return;
    }
    setSuccess(`₦${Number(amount).toLocaleString()} added to wallet.`);
    setAmount('');
    setNote('');
  };

  return (
    <div className="rounded-2xl bg-ink/[0.02] p-4">
      <div className="flex items-center gap-2">
        <Wallet size={15} className="text-brand-500" />
        <h3 className="text-sm font-semibold text-ink">Add Money to Wallet</h3>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          placeholder="Amount (₦)"
          className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{success}</p>}

      <button
        onClick={submit}
        disabled={saving || !amount || Number(amount) <= 0}
        className="mt-3 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add to Wallet'}
      </button>
    </div>
  );
}
