import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import AdminShell from './components/AdminShell';

// Server Component gate: real authorization for /admin lives here (and is re-checked
// independently by every /api/admin/* route). The client-side nav/shell is purely presentational.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  const { data } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', session.uid).maybeSingle();
  if (!data || data.is_admin !== true) redirect('/welcome');

  return <AdminShell>{children}</AdminShell>;
}
