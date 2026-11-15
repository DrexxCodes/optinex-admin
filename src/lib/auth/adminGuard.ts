import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from './session';

// Real authorization for every /api/admin/* route. The Supabase Auth session proves who the
// caller is; the `is_admin` flag on their profile (set in the database, never self-assigned)
// proves they may act as an admin. Checked live on every request so a demotion is immediate.
export async function requireAdmin() {
  const session = await getSessionUser();
  if (!session) return null;

  const { data } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', session.uid).maybeSingle();
  if (!data || data.is_admin !== true) return null;

  return { uid: session.uid, email: session.email };
}
