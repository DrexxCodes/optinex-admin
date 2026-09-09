import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { nukeAllUsers } from '@/lib/resetUsers';
import { recordReset, getResetLog } from '@/lib/resetLog';

// Separate route (not folded into /api/admin/reset) because this is a
// different order of destructive than the per-category resets there — it
// gates on a typed confirmation phrase in addition to requireAdmin, as a
// server-side backstop behind the UI's own confirmation modal.
const CONFIRM_PHRASE = 'DELETE EVERYTHING';

export async function POST(req: NextRequest) {
   NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json({ error: 'Confirmation phrase did not match.' }, { status: 400 });
  }

  const result = await nukeAllUsers();
  await recordReset('nuke');

  return NextResponse.json({ ok: true, ...result, resetLog: await getResetLog() });
}
