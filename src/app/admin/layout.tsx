import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import AdminShell from './components/AdminShell';

// Server Component gate: real authorization for /admin lives here (and is
// re-checked independently by every /api/admin/* route). The client-side
// nav/shell is purely presentational — nothing sensitive is decided there.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  const snap = await adminDb.collection('users').doc(session.uid).get();
  if (!snap.exists || snap.data()?.admin !== true) redirect('/welcome');

  return <AdminShell>{children}</AdminShell>;
}
