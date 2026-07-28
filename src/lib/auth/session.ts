// Server-side session helpers. `getSessionUser()` is the single source of
// truth for "who is logged in" on the server — never trust client state.
import { cookies } from 'next/headers';
import { verifyAccessToken, type AccessTokenPayload } from './jwt';

export const ACCESS_COOKIE = 'optinex_at';
export const REFRESH_COOKIE = 'optinex_rt';

export async function getSessionUser(): Promise<AccessTokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 15 // 15 minutes, mirrors access token TTL
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  };
}
