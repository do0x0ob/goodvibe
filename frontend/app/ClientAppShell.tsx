'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

const Providers = dynamic(() => import('./providers').then((m) => ({ default: m.Providers })), {
  ssr: false,
  loading: () => null,
});
const Header = dynamic(
  () => import('@/components/layout/Header').then((m) => ({ default: m.Header })),
  { ssr: false, loading: () => <header className="bg-canvas-default/80 backdrop-blur-md border-b border-ink-300/20 fixed top-0 w-full z-40 h-20" /> }
);

function HeaderFallback() {
  return (
    <header className="bg-canvas-default/80 backdrop-blur-md border-b border-ink-300/20 fixed top-0 w-full z-40 h-20" />
  );
}

export function ClientAppShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div suppressHydrationWarning>
        <Header />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#1A1A1A',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            border: '1px solid #E5E5E5',
          },
          success: {
            iconTheme: { primary: '#1A1A1A', secondary: '#FFFFFF' },
            style: { border: '1px solid #E5E5E5' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
            style: {
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
            },
          },
        }}
      />
      {children}
    </Providers>
  );
}
