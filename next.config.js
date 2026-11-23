/**
 * Every /api/* call is served by optinex-backend (Fastify). Only what this app uses is forwarded (/api/auth for
 * sign-in/session, /api/admin for the dashboard), so the user-facing API is not reachable through this domain.
 * Cookies set by the backend pass straight through, so they stay host-only on this app's domain.
 */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API_GROUPS = ['auth', 'admin'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // `:path*` also matches the bare group root.
    return API_GROUPS.map((group) => ({ source: `/api/${group}/:path*`, destination: `${BACKEND_URL}/api/${group}/:path*` }));
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: '*.ufs.sh' }
    ],
    // Avatars are now generated and served by our own /api/avatar route as
    // SVG — next/image blocks SVG optimization by default, so this needs to
    // be explicitly opted into for a same-origin, trusted source like ours.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
