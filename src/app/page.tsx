import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export default async function RootPage() {
  const session = await getSessionUser();
  if (!session) redirect('/login');

  const snap = await adminDb.collection('users').doc(session.uid).get();
  redirect(snap.exists && snap.data()?.admin === true ? '/admin' : '/welcome');
}
