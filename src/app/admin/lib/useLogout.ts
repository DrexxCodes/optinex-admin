'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth/authClient';

export function useLogout() {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/auth/signin');
      router.refresh();
    }
  };

  return { logout, loggingOut };
}
