// Server-side session helper. `getSessionUser()` is the single source of truth for
// "who is logged in" on the server — never trust client state. The session itself is a
// Supabase Auth session; its JWT is verified locally (no network call) via getClaims().
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SessionUser = {
  uid: string;
  email: string;
  username: string;
  deviceId: string;
};

// Kept so existing imports of the old JWT payload type keep compiling.
export type AccessTokenPayload = SessionUser;

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const meta = (claims.user_metadata ?? {}) as { username?: string };
  return {
    uid: claims.sub,
    email: String(claims.email ?? ''),
    username: meta.username ?? '',
    deviceId: String(claims.session_id ?? '')
  };
}
