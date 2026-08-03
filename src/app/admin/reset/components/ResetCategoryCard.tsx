'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { formatResetTime } from '../lib/formatResetTime';

export default function ResetCategoryCard({
  title,
  description,
  icon: Icon,
  lastReset,
  isResetting,
  justRanOk,
  justRanError,
  onReset
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  lastReset: string | null;
  isResetting: boolean;
  justRanOk: boolean;
  justRanError?: string;
  onReset: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onReset();
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-xs text-ink/50">{description}</p>
          <p className="mt-1 text-xs text-ink/35">{formatResetTime(lastReset)}</p>
        </div>
      </div>

      {justRanOk && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">{title} reset.</p>}
      {justRanError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{justRanError}</p>}

      <button
        onClick={handleClick}
        onBlur={() => setConfirming(false)}
        disabled={isResetting}
        className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
          confirming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
        }`}
      >
        {isResetting ? 'Resetting…' : confirming ? 'Click again to confirm' : `Reset ${title}`}
      </button>
    </div>
  );
}
