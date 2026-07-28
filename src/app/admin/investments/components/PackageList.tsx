'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { AdminPackage } from '../lib/useAdminInvestments';

export default function PackageList({
  packages,
  onToggleActive,
  onDelete
}: {
  packages: AdminPackage[];
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (packages.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">No packages yet — create one above.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {packages.map((p) => (
        <div key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{p.name}</p>
              {!p.active && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/40">Inactive</span>}
            </div>
            <p className="text-xs text-ink/50">
              ₦{p.price.toLocaleString()} · {p.duration}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onToggleActive(p.id, !p.active)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                p.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {p.active ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => remove(p.id)}
              disabled={deletingId === p.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
              aria-label="Delete package"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
