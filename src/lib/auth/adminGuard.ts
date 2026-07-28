import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from './session';

export async function requireAdmin() {
  const session = await getSessionUser();
  if (!session) return null;

  const snap = await adminDb.collection('users').doc(session.uid).get();
  if (!snap.exists || snap.data()?.admin !== true) return null;

  return { uid: session.uid, email: session.email };
}
