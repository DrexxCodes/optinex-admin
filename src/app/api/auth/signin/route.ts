import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAnalyticsEvent } from '@/lib/analytics';

// Admin sign-in runs server-side (low volume, and it keeps the admin login page unchanged).
// Supabase Auth checks the password and writes the session cookies onto this response.
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Normalize the email so upper-case input can't cause case-sensitivity mismatches.
    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error || !data.user) {
      if (error?.status === 429) {
        return NextResponse.json({ error: 'Too many attempts. Please wait a moment and try again.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, username')
      .eq('id', data.user.id)
      .maybeSingle();
    if (!profile) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await logAnalyticsEvent('signin').catch((e) => console.error('[signin] analytics', e));

    return NextResponse.json({
      user: { uid: profile.id, fullName: profile.full_name, email: profile.email, username: profile.username }
    });
  } catch (err) {
    console.error('[signin]', err);
    return NextResponse.json({ error: 'Something went wrong signing you in.' }, { status: 500 });
  }
}
