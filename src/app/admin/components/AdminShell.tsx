'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LogOut, HelpCircle } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '../lib/navItems';
import { useLogout } from '../lib/useLogout';
import { useTour } from '../lib/useTour';
import AdminTour from './AdminTour';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, loggingOut } = useLogout();
  const tour = useTour();

  return (
    <div className="relative min-h-dvh bg-[#0B1120] lg:flex">
      <aside className="border-b border-white/10 bg-[#0B1120] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
        <div className="relative flex items-center px-4 py-4 lg:block lg:px-0 lg:py-0">
          {/* Logo: stays fixed in place; its opaque background masks the nav
              row scrolling underneath it on mobile. */}
          <div className="relative z-20 flex shrink-0 items-center gap-2.5 bg-[#0B1120] pr-4 lg:bg-transparent lg:pr-0">
            <Image src="/logo.png" alt="Optinex Africa" width={32} height={32} priority className="h-8 w-8 shrink-0 rounded-xl object-cover" />
            <div className="hidden lg:block">
              <p className="font-display text-sm font-bold text-white">Optinex Admin</p>
            </div>
          </div>

          <nav
            data-tour="nav"
            className="no-scrollbar absolute inset-y-0 left-0 right-0 flex items-center gap-1 overflow-x-auto pl-16 pr-4 lg:static lg:mt-10 lg:flex lg:flex-col lg:items-stretch lg:gap-1 lg:overflow-visible lg:p-0"
          >
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname?.startsWith(href + '/'));
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    active ? 'bg-brand-500 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  )}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-1">
          <button
            onClick={tour.start}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white/80"
          >
            <HelpCircle size={17} /> Take a Tour
          </button>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut size={17} /> {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>

      <main className="min-h-dvh flex-1 bg-[#F4F6FB] px-4 py-6 lg:px-10 lg:py-10">{children}</main>

      <AdminTour tour={tour} />
    </div>
  );
}
