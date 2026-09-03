'use client';

// Client-side auth pattern: never rely on onAuthStateChanged for app state —
// the httpOnly `Incossify_at` cookie is the single source of truth. This module
// centralizes the "call API, retry once after a silent refresh" behavior.

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers
      }
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      res = await doFetch();
    }
  }

  return res;
}
