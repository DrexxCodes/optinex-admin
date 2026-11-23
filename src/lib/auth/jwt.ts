// UNVERIFIED peek at a JWT's expiry. This is only ever a UX gate ("is it worth asking the backend to refresh?");
// every API call is still verified by optinex-backend, so a forged cookie can't read or change any data.
export function readTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenFresh(token: string, skewSeconds = 15): boolean {
  const exp = readTokenExpiry(token);
  return exp !== null && exp > Date.now() + skewSeconds * 1000;
}
