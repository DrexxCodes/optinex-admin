import { supabaseAdmin } from '@/lib/supabase/admin';

// Voids every pending withdrawal request. The wallet was already debited when the request was made
// (see Incossify-user's withdrawal request), so voiding it must refund that amount — otherwise the
// money just vanishes. Marked 'reset' (not 'failed') so it's distinguishable from an admin-rejected
// request in any future audit. Runs as a single atomic Postgres function.
export async function resetPendingWithdrawals(): Promise<{ clearedCount: number }> {
  const { data, error } = await supabaseAdmin.rpc('reset_pending_withdrawals');
  if (error) throw new Error(error.message);
  return { clearedCount: Number(data ?? 0) };
}
