// Cookie-aware Supabase client for Route Handlers / Server Components. This is the
// client that reads (and, where Next allows it, refreshes) the user's Supabase Auth session.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env';

export async function createSupabaseServerClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy
          // refreshes sessions for page navigations, so this is safe to ignore.
        }
      }
    }
  });
}
