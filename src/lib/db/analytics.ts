// Global analytics — one atomic Postgres call (public.log_analytics_event) upserts the
// daily / monthly / yearly rows, replacing the old 3-doc Firestore batch.
import { supabaseAdmin } from '@/lib/supabase/admin';

export type AnalyticsAction =
  | 'signup'
  | 'signin'
  | 'checkin'
  | 'spin_reward'
  | 'task_completed'
  | 'investment_submitted'
  | 'investment_verified'
  | 'withdrawal_requested'
  | 'loan_requested'
  | 'casino_score_submitted'
  | 'referral_bonus'
  | 'account_upgrade_submitted'
  | 'account_upgrade_verified'
  | 'package_change_submitted';

// The only two actions that represent money the platform has actually realized — logged
// once an admin approves the user's submitted receipt. Everything else is excluded from
// revenue so the dashboard's "Financial Stats" reflects real income.
const REVENUE_ACTIONS: AnalyticsAction[] = ['investment_verified', 'account_upgrade_verified'];

const pad = (n: number) => String(n).padStart(2, '0');

export async function logAnalyticsEvent(action: AnalyticsAction, amount = 0) {
  const now = new Date();
  const { error } = await supabaseAdmin.rpc('log_analytics_event', {
    p_action: action,
    p_amount: amount,
    p_day: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    p_month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    p_year: `${now.getFullYear()}`,
    p_revenue: REVENUE_ACTIONS.includes(action)
  });
  if (error) throw new Error(error.message);
}
