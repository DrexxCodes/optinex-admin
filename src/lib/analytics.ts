// Global Analytics Library — logs every key system action into three
// pre-aggregated Firestore documents (daily / monthly / yearly) so the admin
// dashboard can render charts with 3 cheap reads instead of scanning events.
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

export type AnalyticsAction =
  | 'signup'
  | 'signin'
  | 'checkin'
  | 'task_completed'
  | 'investment_submitted'
  | 'investment_verified'
  | 'withdrawal_requested'
  | 'casino_score_submitted'
  | 'referral_bonus'
  | 'account_upgrade_submitted'
  | 'account_upgrade_verified';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Performs 3 atomic writes on every key system action:
 *   1. Daily count   -> analytics/daily/{YYYY-MM-DD}
 *   2. Monthly count -> analytics/monthly/{YYYY-MM}
 *   3. Yearly count  -> analytics/yearly/{YYYY}
 * Each doc stores a map of action -> count plus a running `total`.
 */
export async function logAnalyticsEvent(action: AnalyticsAction, amount = 0) {
  const now = new Date();
  const dayId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const yearId = `${now.getFullYear()}`;

  const dailyRef = adminDb.collection('analytics').doc('daily').collection('entries').doc(dayId);
  const monthlyRef = adminDb.collection('analytics').doc('monthly').collection('entries').doc(monthId);
  const yearlyRef = adminDb.collection('analytics').doc('yearly').collection('entries').doc(yearId);

  const payload = {
    [`counts.${action}`]: FieldValue.increment(1),
    total: FieldValue.increment(1),
    ...(amount ? { amountTotal: FieldValue.increment(amount) } : {}),
    updatedAt: FieldValue.serverTimestamp()
  };

  const batch = adminDb.batch();
  batch.set(dailyRef, { date: dayId, ...payload }, { merge: true });
  batch.set(monthlyRef, { month: monthId, ...payload }, { merge: true });
  batch.set(yearlyRef, { year: yearId, ...payload }, { merge: true });

  await batch.commit();
}
