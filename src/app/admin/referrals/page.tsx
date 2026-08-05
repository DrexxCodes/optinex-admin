'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useAdminReferrals } from './lib/useAdminReferrals';
import ReferralPodium from './components/ReferralPodium';
import ReferralLeaderboardTable from './components/ReferralLeaderboardTable';
import ReferralDetailModal from './components/ReferralDetailModal';
import { formatResetTime } from './lib/formatResetTime';

export default function AdminReferralsPage() {
  const { leaderboard, lastReset, loading, resetting, resetError, resetWeek, selected, setSelected } = useAdminReferrals();
  const [confirming, setConfirming] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const top3 = leaderboard.filter((e) => e.rank <= 3);

  const handleResetClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    const ok = await resetWeek();
    if (ok) {
      setJustReset(true);
      setTimeout(() => setJustReset(false), 3000);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Referrals</h1>
          <p className="mt-1 text-sm text-ink/60">Weekly referral leaderboard.</p>
        </div>
        <button
          onClick={handleResetClick}
          onBlur={() => setConfirming(false)}
          disabled={resetting}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            confirming ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
          }`}
        >
          <RotateCcw size={15} /> {resetting ? 'Resetting…' : confirming ? 'Click again to confirm' : 'Reset this week'}
        </button>
      </div>

      <p className="mt-1 text-xs text-ink/35">{formatResetTime(lastReset)}</p>

      {justReset && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
          Weekly count reset for everyone. All-time totals and income are untouched.
        </p>
      )}
      {resetError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{resetError}</p>}

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <ReferralPodium top3={top3} onSelect={setSelected} />
          <ReferralLeaderboardTable entries={leaderboard} onSelect={setSelected} />
        </>
      )}

      {selected && <ReferralDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
