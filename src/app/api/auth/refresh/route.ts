import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase/admin';
import { signAccessToken } from '@/lib/auth/jwt';
import { accessCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: 'No session.' }, { status: 401 });

  const [uid, deviceId, token] = raw.split('.');
  if (!uid || !deviceId || !token) {
    return NextResponse.json({ error: 'Malformed session.' }, { status: 401 });
  }

  const tokenRef = adminDb.collection('users').doc(uid).collection('refreshTokens').doc(deviceId);
  const [tokenSnap, userSnap] = await Promise.all([tokenRef.get(), adminDb.collection('users').doc(uid).get()]);

  // When there's no token at all
  if (!tokenSnap.exists || !userSnap.exists) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  // When there is a token but it's expired
  const stored = tokenSnap.data()!;
  if (stored.expiresAt.toDate() < new Date()) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  // We check if the stored token is a valid token
  const valid = await bcrypt.compare(token, stored.hash);
  if (!valid) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  // if all goes well
  const user = userSnap.data()!;
  const accessToken = await signAccessToken({ uid, email: user.email, username: user.username, deviceId });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
  return res;
}
