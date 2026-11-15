import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  // 'local' ends only this device's session.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  return NextResponse.json({ ok: true });
}
