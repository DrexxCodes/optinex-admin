import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { adminMessaging } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

// Every registered device on the user app subscribes to this topic (see the user app's
// /api/notifications/register), so a single `send({ topic })` call reaches every user with push
// enabled — no need to fetch or loop over individual tokens here. FCM remains the delivery channel;
// the sent-notification history lives in Supabase.
const PLATFORM_TOPIC = 'platform_all';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data } = await supabaseAdmin
    .from('push_notifications')
    .select('id, title, body, link, sent_by, sent_at')
    .order('sent_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    notifications: (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      link: n.link ?? null,
      sentBy: n.sent_by ?? null,
      sentAt: n.sent_at ? new Date(n.sent_at).getTime() : null
    }))
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
          // The user app's own logo — icon/badge paths are resolved against the origin that owns the
          // service worker (the user app), not this admin app, so a root-relative path is correct here.
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        },
        fcmOptions: link?.trim() ? { link: link.trim() } : undefined
      }
    });
  } catch {
    return NextResponse.json({ error: 'Could not send the push notification.' }, { status: 502 });
  }

  const { data } = await supabaseAdmin
    .from('push_notifications')
    .insert({ title: title.trim(), body: body.trim(), link: link?.trim() || null, sent_by: admin.email })
    .select('id')
    .single();

  return NextResponse.json({ ok: true, id: data?.id ?? null, messageId });
}
