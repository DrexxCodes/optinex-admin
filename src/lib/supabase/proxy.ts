// Session refresh for proxy.ts (Next 16's middleware). Validates the JWT locally via
// getClaims() and, if the access token has expired, refreshes it and writes the new
// cookies onto both the request (so Server Components see them) and the response.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env';

export async function updateSession(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        if (headers) Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      }
    }
  });

  const { data } = await supabase.auth.getClaims();
  return { response, authenticated: !!data?.claims?.sub };
}

// Redirects must carry any refreshed session cookies along with them.
export function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
