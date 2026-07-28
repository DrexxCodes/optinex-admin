import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
  return NextResponse.json({
    tasks: snap.docs.map((d) => {
      const t = d.data();
      return {
        id: d.id,
        name: t.name,
        details: t.details,
        buttonLabel: t.buttonLabel ?? '',
        link: t.link ?? '',
        reward: t.reward,
        active: t.active !== false
      };
    })
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { name, details, buttonLabel, link, reward } = await req.json();
  if (!name || !details || !reward || reward <= 0) {
    return NextResponse.json({ error: 'Name, details, and reward are required.' }, { status: 400 });
  }

  // buttonLabel/link are optional — if the admin leaves them blank the user
  // app just renders a plain "Complete" button with no outbound link.
  const ref = adminDb.collection('tasks').doc();
  await ref.set({
    name,
    details,
    buttonLabel: buttonLabel || '',
    link: link || '',
    reward: Number(reward),
    active: true,
    createdAt: FieldValue.serverTimestamp()
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
