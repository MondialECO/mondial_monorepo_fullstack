'use client';

import { AuthProvider } from '@/app/_providers/AuthProvider';
import { ReactQueryProvider } from '@/app/_providers/ReactQueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </AuthProvider>
  );
}
