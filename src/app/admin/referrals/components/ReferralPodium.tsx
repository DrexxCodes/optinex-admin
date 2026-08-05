'use client';

import { Crown, Trophy } from 'lucide-react';
import type { ReferralLeaderboardEntry } from '../lib/useAdminReferrals';

const PODIUM_STYLES: Record<number, { badge: string; ring: string; icon: typeof Trophy }> = {
  1: { badge: 'bg-amber-50 text-amber-600', ring: 'ring-amber-200', icon: Crown },
  2: { badge: 'bg-ink/5 text-ink/50', ring: 'ring-ink/10', icon: Trophy },
  3: { badge: 'bg-orange-50 text-orange-500', ring: 'ring-orange-200', icon: Trophy }
};

// Classic podium order: 2nd on the left, 1st in the (taller) middle, 3rd on the right.
const ORDER = [2, 1, 3];

export default function ReferralPodium({
  top3,
  onSelect
}: {
  top3: ReferralLeaderboardEntry[];
  onSelect: (entry: ReferralLeaderboardEntry) => void;
}) {
  if (top3.length === 0) return null;

  const byRank = new Map(top3.map((e) => [e.rank, e]));

  return (
    <div className="mt-5 grid grid-cols-3 items-end gap-3">
      {ORDER.map((rank) => {
        const entry = byRank.get(rank);
        const style = PODIUM_STYLES[rank];
        const Icon = style.icon;
        const padding = rank === 1 ? 'pb-8 pt-6' : rank === 2 ? 'pb-6 pt-5' : 'pb-5 pt-5';

        if (!entry) {
          return <div key={rank} className="h-32 rounded-2xl bg-white/40" />;
        }

        return (
          <button
            key={rank}
            onClick={() => onSelect(entry)}
            className={`flex flex-col items-center rounded-2xl bg-white text-center shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${style.ring} ${padding}`}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${style.badge}`}>
              <Icon size={rank === 1 ? 22 : 18} />
            </span>
            <p className="mt-3 max-w-full truncate px-2 text-sm font-semibold text-ink">{entry.fullName}</p>
            <p className="max-w-full truncate px-2 text-xs text-ink/40">@{entry.username || 'user'}</p>
            <p className="mt-2 font-display text-lg font-bold text-ink">{entry.weeklyReferrals.toLocaleString()}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink/35">referrals this week</p>
          </button>
        );
      })}
    </div>
  );
}
