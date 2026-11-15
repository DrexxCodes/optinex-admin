import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';

export default async function RootPage() {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  const { data } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', session.uid).maybeSingle();
  redirect(data?.is_admin === true ? '/admin' : '/welcome');
}
