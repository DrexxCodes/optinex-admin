import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (raw) {
    const [uid, deviceId] = raw.split('.');
    if (uid && deviceId) {
      await adminDb.collection('users').doc(uid).collection('refreshTokens').doc(deviceId).delete().catch(() => {});
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
