import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('config').doc('popup').get();
  const data = snap.exists ? snap.data()! : {};
  return NextResponse.json({
    enabled: data.enabled === true,
    title: data.title ?? '',
    body: data.body ?? '',
    actionLabel: data.actionLabel ?? '',
    actionLink: data.actionLink ?? ''
  });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { enabled, title, body, actionLabel, actionLink } = await req.json();

  if (enabled && (!title?.trim() || !body?.trim())) {
    return NextResponse.json({ error: 'A title and body are required to enable the notification.' }, { status: 400 });
  }
  // Action button is optional, but if one half is set both must be — a link
  // with no label (or vice versa) would render broken on the user side.
  if ((actionLabel?.trim() && !actionLink?.trim()) || (!actionLabel?.trim() && actionLink?.trim())) {
    return NextResponse.json({ error: 'Set both an action label and link, or leave both empty.' }, { status: 400 });
  }

  await adminDb.collection('config').doc('popup').set(
    {
      enabled: !!enabled,
      title: title?.trim() ?? '',
      body: body?.trim() ?? '',
      actionLabel: actionLabel?.trim() || null,
      actionLink: actionLink?.trim() || null
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
