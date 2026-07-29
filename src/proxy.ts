import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

// Without this, `admin/layout.tsx` and `page.tsx` (Server Components) call
// getSessionUser() directly and redirect to /login the instant the 15-minute
// access token has expired — even when the 30-day refresh token is still
// perfectly valid. The client-side authFetch retry-on-401 only helps for
// fetches made after a page is already mounted; it does nothing for a fresh
// navigation or hard reload, which is exactly what a Server Component gate
// sees. This proxy runs first and silently refreshes the access token
// by proxying to the existing /api/auth/refresh handler, so a still-valid
// session is never mistaken for a logged-out one.
export const config = {
  matcher: ['/', '/admin/:path*', '/welcome']
};

export async function proxy(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const validAccessToken = accessToken ? await verifyAccessToken(accessToken) : null;
  if (validAccessToken) return NextResponse.next();

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next(); // truly no session — let the page-level check redirect to /login

  const refreshRes = await fetch(new URL('/api/auth/refresh', req.url), {
    method: 'POST',
    headers: { cookie: req.headers.get('cookie') ?? '' }
  });

  // Refresh token invalid/expired/revoked — let the page-level check redirect to /login as before.
  if (!refreshRes.ok) return NextResponse.next();

  // Forward the freshly-minted access token cookie onto the actual request.
  const setCookie = refreshRes.headers.get('set-cookie');
  const res = NextResponse.next();
  if (setCookie) res.headers.append('set-cookie', setCookie);
  return res;
}
