import { supabaseAdmin } from '@/lib/supabase/admin';

// Zeroes specific fields (e.g. 'counts.checkin', 'revenueTotal') across every existing
// daily / monthly / yearly analytics row.
//
// Deliberately field-scoped rather than wiping whole rows: `total` and `amount_total` are shared
// counters incremented by *every* action type, so resetting e.g. "check-in stats" must never touch
// them — that would silently erase unrelated signup/signin/financial history too.
export async function resetAnalyticsFields(fields: string[]) {
  const { error } = await supabaseAdmin.rpc('reset_analytics_fields', { p_fields: fields });
  if (error) throw new Error(error.message);
}
