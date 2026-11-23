// Server-only: where the Fastify backend (optinex-backend) lives. The browser never sees this — it talks to
// same-origin /api/*, which next.config.js rewrites to this URL.
export const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
