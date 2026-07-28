'use client';

import { LayoutGrid, ChevronsUp, TrendingUp, Wallet, Bell, Users, X } from 'lucide-react';
import type { TourState } from '../lib/useTour';

const STEPS = [
  {
    icon: LayoutGrid,
    title: 'Overview',
    body: 'Your at-a-glance dashboard — pending upgrades, investments, and withdrawals, plus total users and package subscriber counts.'
  },
  {
    icon: ChevronsUp,
    title: 'Upgrade',
    body: 'Set the price and bank account for the Account Upgrade product, then approve or reject receipts users submit.'
  },
  {
    icon: TrendingUp,
    title: 'Investments',
    body: 'Create as many investment packages as you like, manage the payment account, and verify pending investment receipts.'
  },
  {
    icon: Wallet,
    title: 'Withdrawals',
    body: 'Control when withdrawals open, and settle pending requests — approving marks a request paid, rejecting refunds the wallet.'
  },
  {
    icon: Bell,
    title: 'Notification',
    body: 'Compose a one-time popup notification that users see the next time they open their dashboard.'
  },
  {
    icon: Users,
    title: 'Users',
    body: 'Search recent accounts and grant or revoke admin access.'
  }
];

export default function AdminTour({ tour }: { tour: TourState }) {
  if (!tour.open) return null;

  const current = STEPS[tour.step];
  const isLast = tour.step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <current.icon size={22} />
          </span>
          <button onClick={tour.close} className="text-ink/30 hover:text-ink/60" aria-label="Close tour">
            <X size={18} />
          </button>
        </div>

        <h2 className="mt-4 font-display text-lg font-bold text-ink">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{current.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full transition ${i === tour.step ? 'bg-brand-500' : 'bg-ink/10'}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tour.step > 0 && (
              <button onClick={() => tour.setStep(tour.step - 1)} className="rounded-lg px-3 py-2 text-xs font-semibold text-ink/50 hover:bg-ink/5">
                Back
              </button>
            )}
            {isLast ? (
              <button onClick={tour.close} className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600">
                Finish
              </button>
            ) : (
              <button
                onClick={() => tour.setStep(tour.step + 1)}
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
