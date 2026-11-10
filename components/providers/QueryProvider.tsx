'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

// 4xx (selain 408/429) tidak akan berubah kalau diulang — langsung tampilkan error.
const shouldRetry = (failureCount: number, err: unknown) => {
  if (isAxiosError(err)) {
    const s = err.response?.status;
    if (s && s >= 400 && s < 500 && s !== 408 && s !== 429) return false;
  }
  return failureCount < 1;
};

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: shouldRetry,
          },
        },
      })
  );

  // Ganti akun (logout / login user lain) → buang SEMUA cache. Dulu data
  // ['me'], ['orders'], dst. milik akun sebelumnya masih tampil (staleTime 60 dtk)
  // setelah login sebagai user lain di device yang sama.
  useEffect(() => {
    let prevToken = useAuthStore.getState().token;
    return useAuthStore.subscribe((state) => {
      if (state.token !== prevToken) {
        const hadSession = prevToken !== null;
        prevToken = state.token;
        if (hadSession) queryClient.clear();
      }
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
