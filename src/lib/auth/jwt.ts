// JWT helpers built on `jose`. Access tokens are short-lived and verified on
// every request; refresh tokens are opaque random strings, bcrypt-hashed and
// stored in Firestore so a stolen JWT alone can never mint a new session.
import { SignJWT, jwtVerify } from 'jose';

export type AccessTokenPayload = {
  uid: string;
  email: string;
  username: string;
  deviceId: string;
};

const ACCESS_TOKEN_TTL = '15m';
const AUDIENCE = 'Incossify-user';

function accessSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), { audience: AUDIENCE });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
