import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import AdminShell from './components/AdminShell';

// Server Component gate for /admin (UX + defense in depth): the backend verifies the session and the live
// `is_admin` flag. Every /api/admin/* request is independently re-checked by the backend, so this layout is
// never the only line of defense. The client-side nav/shell is purely presentational.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/login');
  if (!session.admin) redirect('/welcome');

  return <AdminShell>{children}</AdminShell>;
}
