// Tiny Set-Cookie parser — enough to copy the backend's refreshed session cookies onto a NextResponse.
export type ParsedCookie = {
  name: string;
  value: string;
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
  };
};

export function parseSetCookie(header: string): ParsedCookie | null {
  const [pair, ...attrs] = header.split(';').map((s) => s.trim());
  const eq = pair.indexOf('=');
  if (eq < 1) return null;

  const cookie: ParsedCookie = { name: pair.slice(0, eq), value: decodeURIComponent(pair.slice(eq + 1)), options: {} };
  for (const attr of attrs) {
    const [k, ...rest] = attr.split('=');
    const v = rest.join('=');
    switch (k.toLowerCase()) {
      case 'httponly': cookie.options.httpOnly = true; break;
      case 'secure': cookie.options.secure = true; break;
      case 'samesite': cookie.options.sameSite = v.toLowerCase() as 'lax' | 'strict' | 'none'; break;
      case 'path': cookie.options.path = v; break;
      case 'domain': cookie.options.domain = v; break;
      case 'max-age': cookie.options.maxAge = Number(v); break;
      case 'expires': cookie.options.expires = new Date(v); break;
    }
  }
  return cookie;
}
