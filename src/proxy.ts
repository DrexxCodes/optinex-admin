import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth/proxySession';

// Server Components (`admin/layout.tsx`, `page.tsx`) ask optinex-backend who the visitor is. If the 1-hour
// access token has lapsed, this proxy first asks the backend to rotate it (and re-issues the cookies), so a
// still-valid session is never mistaken for a logged-out one on a fresh navigation.
export const config = {
  matcher: ['/', '/admin/:path*', '/welcome']
};

export async function proxy(req: NextRequest) {
  // No session at all → fall through and let the page-level check redirect to /login as before.
  const { response } = await updateSession(req);
  return response;
}
