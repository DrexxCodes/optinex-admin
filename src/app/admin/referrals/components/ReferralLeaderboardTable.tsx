'use client';

import { Trophy } from 'lucide-react';
import type { ReferralLeaderboardEntry } from '../lib/useAdminReferrals';

const MEDAL_COLORS: Record<number, string> = {
  1: 'bg-amber-50 text-amber-600',
  2: 'bg-ink/5 text-ink/50',
  3: 'bg-orange-50 text-orange-500'
};

export default function ReferralLeaderboardTable({
  entries,
  onSelect
}: {
  entries: ReferralLeaderboardEntry[];
  onSelect: (entry: ReferralLeaderboardEntry) => void;
}) {
  if (entries.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-ink/40 shadow-sm">No referrals yet.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3">Rank</th>
              <th className="px-5 py-3">Referrer</th>
              <th className="px-5 py-3 text-right">This week</th>
              <th className="px-5 py-3 text-right">All-time</th>
              <th className="px-5 py-3 text-right">All-time income</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.uid}
                onClick={() => onSelect(e)}
                className="cursor-pointer border-b border-ink/5 transition last:border-0 hover:bg-ink/[0.02]"
              >
                <td className="px-5 py-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${MEDAL_COLORS[e.rank] ?? 'bg-ink/[0.03] text-ink/50'}`}
                  >
                    {e.rank <= 3 ? <Trophy size={13} /> : e.rank}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="whitespace-nowrap font-medium text-ink">{e.fullName}</p>
                  <p className="whitespace-nowrap text-xs text-ink/40">@{e.username || 'user'}</p>
                </td>
                <td className="px-5 py-3 text-right font-display font-bold text-ink">{e.weeklyReferrals.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-ink/70">{e.allTimeReferrals.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-ink/70">₦{e.allTimeIncome.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
