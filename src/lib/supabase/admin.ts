// Service-role Supabase client — server-side only. Never import this from client components.
// It bypasses RLS on purpose: every table is locked down for anon/authenticated, so the
// Next.js API routes (which authenticate the caller first) are the only door into the data,
// exactly like firebase-admin was before.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

export const supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
