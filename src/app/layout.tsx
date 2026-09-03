import type { Metadata, Viewport } from 'next';
import './globals.css';
import RouteLoader from '@/components/RouteLoader';

export const metadata: Metadata = {
  title: 'Incossify Admin',
  description: 'Local-only admin portal for Incossify Africa. Not deployed publicly.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-frost font-body text-ink antialiased">
        <RouteLoader />
        {children}
      </body>
    </html>
  );
}
