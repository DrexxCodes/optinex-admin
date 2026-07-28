'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Global preloader that runs across route changes, mirroring the user app.
export default function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 380);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1120]/70 backdrop-blur-sm">
      <Image src="/loader.gif" alt="Loading" width={72} height={72} unoptimized priority />
    </div>
  );
}
