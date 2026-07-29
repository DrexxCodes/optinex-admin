'use client';

import { useState } from 'react';
import { AlertTriangle, DollarSign, CalendarCheck, UserPlus, Gamepad2 } from 'lucide-react';
import { useAdminReset, type ResetCategory } from './lib/useAdminReset';

const CATEGORIES: { id: ResetCategory; title: string; description: string; icon: typeof DollarSign }[] = [
  {
    id: 'financial',
    title: 'Financial Stats',
    description: 'Zeroes revenue totals and investment/upgrade submission & approval counts, across daily, monthly, and yearly analytics.',
    icon: DollarSign
  },
  {
    id: 'checkin',
    title: 'Check-in Stats',
    description: 'Zeroes daily check-in counts across daily, monthly, and yearly analytics.',
    icon: CalendarCheck
  },
  {
    id: 'signup',
    title: 'Signup Stats',
    description: 'Zeroes signup counts across daily, monthly, and yearly analytics — used by the Overview signup chart.',
    icon: UserPlus
  },
  {
    id: 'game',
    title: 'Game Stats',
    description: 'Wipes the Upstash leaderboard (all scores and usernames) and zeroes the games-played counter.',
    icon: Gamepad2
  }
];

export default function AdminResetPage() {
  const { reset, resetting, result } = useAdminReset();
  const [confirming, setConfirming] = useState<ResetCategory | null>(null);

  const handleReset = async (category: ResetCategory) => {
    if (confirming !== category) {
      setConfirming(category);
      return;
    }
    await reset(category);
    setConfirming(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h1 className="font-display text-xl font-bold text-ink">Reset Stats</h1>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Permanently zeroes historical stats. This page isn&apos;t linked from the nav — bookmark it if you need it again.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map(({ id, title, description, icon: Icon }) => {
          const isConfirming = confirming === id;
          const isResetting = resetting === id;
          const justRan = result?.category === id;

          return (
            <div key={id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs text-ink/50">{description}</p>
                </div>
              </div>

              {justRan && (
                <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${result?.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {result?.ok ? `${title} reset.` : (result?.error ?? 'Could not reset.')}
                </p>
              )}

              <button
                onClick={() => handleReset(id)}
                onBlur={() => setConfirming((c) => (c === id ? null : c))}
                disabled={isResetting}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                  isConfirming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
                }`}
              >
                {isResetting ? 'Resetting…' : isConfirming ? 'Click again to confirm' : `Reset ${title}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
