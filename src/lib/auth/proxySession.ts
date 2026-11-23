// Session handling for proxy.ts (Next 16's middleware) — no database or auth-provider access here.
//   • Access cookie still fresh        -> signed in, nothing to do.
//   • Expired, refresh cookie present  -> ask optinex-backend to rotate it, and copy the new cookies onto the
//                                         request (Server Components) and the response (browser).
//   • Backend says the refresh token is dead -> clear the cookies, signed out.
//   • Backend unreachable / erroring   -> keep the session as-is (don't log people out during an outage).
import { NextResponse, type NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/api/backend';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies';
import { isTokenFresh } from './jwt';
import { parseSetCookie } from './setCookie';

type Refresh = { kind: 'ok'; cookies: ReturnType<typeof parseSetCookie>[] } | { kind: 'invalid' } | { kind: 'unavailable' };

async function refreshViaBackend(refreshToken: string, req: NextRequest): Promise<Refresh> {
  try {
    const headers: Record<string, string> = { cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}` };
    // Let the backend's per-IP rate limits see the real client, not this server.
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) headers['x-forwarded-for'] = forwarded;

    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, { method: 'POST', headers, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (res.ok) return { kind: 'ok', cookies: res.headers.getSetCookie().map(parseSetCookie) };
    return res.status === 401 ? { kind: 'invalid' } : { kind: 'unavailable' };
  } catch {
    return { kind: 'unavailable' };
  }
}

export async function updateSession(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access && isTokenFresh(access)) return { response, authenticated: true };

  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return { response, authenticated: false };

  const result = await refreshViaBackend(refresh, req);

  if (result.kind === 'unavailable') return { response, authenticated: true };

  if (result.kind === 'invalid') {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return { response, authenticated: false };
  }

  const fresh = result.cookies.filter((c): c is NonNullable<typeof c> => !!c);
  fresh.forEach((c) => req.cookies.set(c.name, c.value));
  response = NextResponse.next({ request: req });
  fresh.forEach((c) => response.cookies.set(c.name, c.value, c.options));
  return { response, authenticated: true };
}

// Redirects must carry any refreshed session cookies along with them.
export function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
