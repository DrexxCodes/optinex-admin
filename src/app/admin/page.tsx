'use client';

import Link from 'next/link';
import { Users, UserCheck, ChevronsUp, TrendingUp, Wallet } from 'lucide-react';
import { useAdminOverview } from './lib/useAdminOverview';
import StatCard from './components/StatCard';
import SignupChart from './components/SignupChart';
import FinancialStats from './components/FinancialStats';

export default function AdminOverviewPage() {
  const { data, loading } = useAdminOverview();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Overview</h1>
      <p className="mt-1 text-sm text-ink/60">A quick look at what needs your attention.</p>

      {loading && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Total Users" value={data.totalUsers} icon={Users} />
            <StatCard label="Total Upgraded" value={data.upgradedUsers} icon={UserCheck} tone="emerald" />
            <StatCard label="Pending Upgrades" value={data.pendingUpgrades} icon={ChevronsUp} tone="amber" />
            <StatCard label="Pending Investments" value={data.pendingInvestments} icon={TrendingUp} tone="amber" />
            <StatCard label="Pending Withdrawals" value={`₦${data.pendingWithdrawalTotal.toLocaleString()}`} icon={Wallet} tone="red" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SignupChart signups={data.signups} />
            <FinancialStats daily={data.financial.daily} monthly={data.financial.monthly} yearly={data.financial.yearly} />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-sm font-bold text-ink">Package Subscribers</h2>
            <p className="mt-1 text-xs text-ink/50">How many users are on each investment package, out of {data.totalUsers} total.</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-ink/[0.02] px-4 py-3">
                <span className="text-sm font-medium text-ink/70">Free (no package)</span>
                <span className="font-display text-sm font-bold text-ink">{data.freeUsers}</span>
              </div>
              {data.packages.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink/40">No packages created yet.</p>
              ) : (
                data.packages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-ink/[0.02] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-ink/40">₦{p.price.toLocaleString()}</span>
                      {!p.active && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/40">Inactive</span>}
                    </div>
                    <span className="font-display text-sm font-bold text-ink">{p.subscribers}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/upgrade" className="rounded-2xl bg-white p-4 text-sm font-semibold text-ink shadow-sm transition hover:shadow-md">
          Manage Upgrade Pricing →
        </Link>
        <Link href="/admin/investments" className="rounded-2xl bg-white p-4 text-sm font-semibold text-ink shadow-sm transition hover:shadow-md">
          Manage Investment Packages →
        </Link>
        <Link href="/admin/withdrawals" className="rounded-2xl bg-white p-4 text-sm font-semibold text-ink shadow-sm transition hover:shadow-md">
          Review Withdrawal Requests →
        </Link>
        <Link href="/admin/tasks" className="rounded-2xl bg-white p-4 text-sm font-semibold text-ink shadow-sm transition hover:shadow-md">
          Manage Tasks →
        </Link>
      </div>
    </div>
  );
}
