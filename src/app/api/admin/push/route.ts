import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

// Every registered device on the user app subscribes to this topic (see
// optinex-user-main's /api/notifications/register), so a single
// `send({ topic })` call reaches every user with push enabled — no need to
// fetch or loop over individual tokens here.
const PLATFORM_TOPIC = 'platform_all';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const snap = await adminDb.collection('pushNotifications').orderBy('sentAt', 'desc').limit(20).get();
  return NextResponse.json({
    notifications: snap.docs.map((d) => {
      const n = d.data();
      return {
        id: d.id,
        title: n.title,
        body: n.body,
        link: n.link ?? null,
        sentBy: n.sentBy ?? null,
        sentAt: n.sentAt?.toMillis?.() ?? null
      };
    })
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { title, body, link } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'A title and body are required.' }, { status: 400 });
  }

  let messageId: string;
  try {
    messageId = await adminMessaging.send({
      topic: PLATFORM_TOPIC,
      notification: {
        title: title.trim(),
        body: body.trim()
      },
      webpush: {
        notification: {
          // The user app's own logo — icon/badge paths are resolved against
          // the origin that owns the service worker (the user app), not
          // this admin app, so a root-relative path is correct here.
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        },
        fcmOptions: link?.trim() ? { link: link.trim() } : undefined
      }
    });
  } catch {
    return NextResponse.json({ error: 'Could not send the push notification.' }, { status: 502 });
  }

  const ref = adminDb.collection('pushNotifications').doc();
  await ref.set({
    title: title.trim(),
    body: body.trim(),
    link: link?.trim() || null,
    sentBy: admin.email,
    sentAt: FieldValue.serverTimestamp()
  });

  return NextResponse.json({ ok: true, id: ref.id, messageId });
}
