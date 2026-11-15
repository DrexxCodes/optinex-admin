import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Explicit session refresh, used by authFetch after a 401. Supabase rotates the tokens and the
// new cookies are written onto this response.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  return NextResponse.json({ ok: true });
}
