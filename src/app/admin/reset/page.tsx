'use client';

import { AlertTriangle, DollarSign, CalendarCheck, UserPlus, Users2, Wallet } from 'lucide-react';
import { useAdminReset } from './lib/useAdminReset';
import ResetCategoryCard from './components/ResetCategoryCard';
import GameResetPicker from './components/GameResetPicker';
import NukeUsersCard from './components/NukeUsersCard';

export default function AdminResetPage() {
  const { reset, resetting, result, resetLog, loadingLog, nukeUsers, nuking, nukeResult } = useAdminReset();

  return (
    <div>
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h1 className="font-display text-xl font-bold text-ink">Reset Stats</h1>
      </div>
      <p className="mt-1 text-sm text-ink/60">Permanently zeroes historical stats. Each action asks you to confirm once before running.</p>

      {loadingLog ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ResetCategoryCard
            title="Financial Stats"
            description="Zeroes revenue totals and investment/upgrade submission & approval counts, across daily, monthly, and yearly analytics."
            icon={DollarSign}
            lastReset={resetLog?.financial ?? null}
            isResetting={resetting === 'financial'}
            justRanOk={result?.key === 'financial' && result.ok}
            justRanError={result?.key === 'financial' && !result.ok ? (result.error ?? 'Could not reset.') : undefined}
            onReset={() => reset('financial')}
          />
          <ResetCategoryCard
            title="Check-in Stats"
            description="Zeroes daily check-in counts across daily, monthly, and yearly analytics."
            icon={CalendarCheck}
            lastReset={resetLog?.checkin ?? null}
            isResetting={resetting === 'checkin'}
            justRanOk={result?.key === 'checkin' && result.ok}
            justRanError={result?.key === 'checkin' && !result.ok ? (result.error ?? 'Could not reset.') : undefined}
            onReset={() => reset('checkin')}
          />
          <ResetCategoryCard
            title="Signup Stats"
            description="Zeroes signup counts across daily, monthly, and yearly analytics — used by the Overview signup chart."
            icon={UserPlus}
            lastReset={resetLog?.signup ?? null}
            isResetting={resetting === 'signup'}
            justRanOk={result?.key === 'signup' && result.ok}
            justRanError={result?.key === 'signup' && !result.ok ? (result.error ?? 'Could not reset.') : undefined}
            onReset={() => reset('signup')}
          />
          <ResetCategoryCard
            title="Referral Stats"
            description="Clears every user's referral connections and referral earnings, and wipes the referral leaderboard. Doesn't claw back referral bonuses already paid into wallets."
            icon={Users2}
            lastReset={resetLog?.referral ?? null}
            isResetting={resetting === 'referral'}
            justRanOk={result?.key === 'referral' && result.ok}
            justRanError={result?.key === 'referral' && !result.ok ? (result.error ?? 'Could not reset.') : undefined}
            onReset={() => reset('referral')}
          />
          <ResetCategoryCard
            title="Pending Withdrawals"
            description="Voids every pending withdrawal request and refunds the debited wallet amount back to each user."
            icon={Wallet}
            lastReset={resetLog?.withdrawals ?? null}
            isResetting={resetting === 'withdrawals'}
            justRanOk={result?.key === 'withdrawals' && result.ok}
            justRanError={result?.key === 'withdrawals' && !result.ok ? (result.error ?? 'Could not reset.') : undefined}
            onReset={() => reset('withdrawals')}
          />
          {resetLog && (
            <GameResetPicker
              lastResetByGame={resetLog.game}
              resetting={resetting}
              result={result}
              onReset={(gameId) => reset('game', gameId)}
            />
          )}
        </div>
      )}

      {!loadingLog && resetLog && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500/70">Danger zone</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <NukeUsersCard lastReset={resetLog.nuke} nuking={nuking} nukeResult={nukeResult} onNuke={nukeUsers} />
          </div>
        </div>
      )}
    </div>
  );
}
