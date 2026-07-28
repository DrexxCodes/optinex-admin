'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/auth/claim-admin', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          setStatus('error');
          return;
        }
        const data = await res.json();
        setFullName(data.fullName);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0B1120] px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
        {status === 'loading' && <p className="py-8 text-sm text-ink/50">Setting things up…</p>}

        {status === 'error' && <p className="py-8 text-sm text-red-500">Something went wrong. Try refreshing the page.</p>}

        {status === 'ready' && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <PartyPopper size={26} />
            </span>
            <h1 className="mt-4 font-display text-xl font-bold text-ink">Welcome, Admin{fullName ? `, ${fullName.split(' ')[0]}` : ''}!</h1>
            <p className="mt-2 text-sm text-ink/60">
              Your account now has admin access to Optinex. You can manage upgrades, investments, withdrawals, notifications, and users
              from here.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              Enter Admin Portal <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
