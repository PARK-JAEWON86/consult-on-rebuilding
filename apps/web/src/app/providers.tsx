'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';

interface ProvidersProps {
  children: ReactNode;
  initialUser?: any;
}

export default function Providers({ children, initialUser }: ProvidersProps) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  }));
  
  return (
    <QueryClientProvider client={client}>
      <AuthProvider initialUser={initialUser}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
