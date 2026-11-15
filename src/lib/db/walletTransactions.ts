// Cursor-paginated wallet history, newest first. The cursor is the id of the last row of
// the previous page (ids are monotonically increasing per insert).
import { supabaseAdmin } from '@/lib/supabase/admin';
import { iso, num } from './format';

export async function listWalletTransactions(userId: string, limit: number, cursor: string | null) {
  let query = supabaseAdmin
    .from('wallet_transactions')
    .select('id, txn_type, txn_name, amount, txn_ref, created_at')
    .eq('user_id', userId)
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (cursor && /^\d+$/.test(cursor)) query = query.lt('id', cursor);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return {
    transactions: page.map((t) => ({
      id: String(t.id),
      txnType: t.txn_type,
      txnName: t.txn_name,
      amount: num(t.amount),
      txnRef: t.txn_ref,
      timestamp: iso(t.created_at)
    })),
    hasMore,
    nextCursor: hasMore ? String(page[page.length - 1].id) : null
  };
}
