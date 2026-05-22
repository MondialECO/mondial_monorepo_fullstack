'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './AuthProvider';
import { ReactQueryProvider } from './ReactQueryProvider';
import DevServiceWorkerCleanup from '@/components/shared/DevServiceWorkerCleanup';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <DevServiceWorkerCleanup />
      <AuthProvider>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
