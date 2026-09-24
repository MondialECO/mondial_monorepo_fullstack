'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

let globalQueryClient: QueryClient | null = null;

export function getAppQueryClient(): QueryClient | null {
  return globalQueryClient;
}

export function clearAppQueryCache(): void {
  globalQueryClient?.clear();
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new client for each request
  const [queryClient] = useState(
    () => {
      const client = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      });
      globalQueryClient = client;
      return client;
    }
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}