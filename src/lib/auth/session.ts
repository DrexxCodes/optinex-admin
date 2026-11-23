// Server-component session lookup. The admin app has no database or auth-provider access: it forwards the
// visitor's httpOnly cookies to optinex-backend, which verifies the session and reports whether the account is
// an admin (`profiles.is_admin`, checked live). One call replaces the old session-read + profile-read pair.
import { cookies } from 'next/headers';
import { BACKEND_URL } from '@/lib/api/backend';

export type ServerSession = { uid: string; email: string; admin: boolean };

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerSession;
  } catch {
    return null;
  }
}
