import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Server Components (`admin/layout.tsx`, `page.tsx`) read the Supabase Auth session directly. If
// the 1-hour access token has expired, this proxy silently refreshes it (and re-issues the cookies)
// first, so a still-valid session is never mistaken for a logged-out one on a fresh navigation.
export const config = {
  matcher: ['/', '/admin/:path*', '/welcome']
};

export async function proxy(req: NextRequest) {
  // No session at all → fall through and let the page-level check redirect to /login as before.
  const { response } = await updateSession(req);
  return response ?? NextResponse.next();
}
