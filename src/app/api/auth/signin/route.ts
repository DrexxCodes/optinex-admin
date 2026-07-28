import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { signAccessToken } from '@/lib/auth/jwt';
import { accessCookieOptions, refreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // we have to normalize the email to lowercase in case the user decides to use uppercase letters in their email address. This is a common practice to ensure consistency and avoid issues with case sensitivity.
    const normalizedEmail = String(email).trim().toLowerCase();
    const snap = await adminDb.collection('users').where('email', '==', normalizedEmail).limit(1).get();

    // If something returns empty
    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const userDoc = snap.docs[0];
    const user = userDoc.data();
    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const deviceId = randomBytes(8).toString('hex');
    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await userDoc.ref.collection('refreshTokens').doc(deviceId).set({
      hash: refreshHash,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    });

    const accessToken = await signAccessToken({
      uid: userDoc.id,
      email: user.email,
      username: user.username,
      deviceId
    });

    await logAnalyticsEvent('signin');

    const res = NextResponse.json({
      user: { uid: userDoc.id, fullName: user.fullName, email: user.email, username: user.username }
    });
    res.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    res.cookies.set(REFRESH_COOKIE, `${userDoc.id}.${deviceId}.${refreshToken}`, refreshCookieOptions());
    return res;
  } catch (err) {
    console.error('[signin]', err);
    return NextResponse.json({ error: 'Something went wrong signing you in.' }, { status: 500 });
  }
}
