'use client';

import { useState } from 'react';
import { Trash2, Link2 } from 'lucide-react';
import type { AdminTask } from '../lib/useAdminTasks';

export default function TaskList({
  tasks,
  onToggleActive,
  onDelete
}: {
  tasks: AdminTask[];
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (tasks.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/50 shadow-sm">No tasks yet — create one above.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              {!t.active && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/40">Inactive</span>}
              {t.link ? (
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                  <Link2 size={10} /> {t.buttonLabel || 'Button'}
                </span>
              ) : (
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/40">Complete-only</span>
              )}
            </div>
            <p className="truncate text-xs text-ink/50">{t.details}</p>
            <p className="text-xs text-ink/40">₦{t.reward.toLocaleString()} reward</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onToggleActive(t.id, !t.active)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                t.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {t.active ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => remove(t.id)}
              disabled={deletingId === t.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
