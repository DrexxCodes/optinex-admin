import { Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../lib/useAdminLeaderboard';

const MEDAL_COLORS: Record<number, string> = {
  1: 'bg-amber-50 text-amber-600',
  2: 'bg-ink/5 text-ink/50',
  3: 'bg-orange-50 text-orange-500'
};

export default function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-ink/40 shadow-sm">No scores yet.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/5 text-xs font-semibold uppercase tracking-wide text-ink/40">
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">Player</th>
            <th className="px-5 py-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.uid} className="border-b border-ink/5 last:border-0">
              <td className="px-5 py-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${MEDAL_COLORS[e.rank] ?? 'bg-ink/[0.03] text-ink/50'}`}
                >
                  {e.rank <= 3 ? <Trophy size={13} /> : e.rank}
                </span>
              </td>
              <td className="px-5 py-3 font-medium text-ink">{e.username}</td>
              <td className="px-5 py-3 text-right font-display font-bold text-ink">{e.score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
