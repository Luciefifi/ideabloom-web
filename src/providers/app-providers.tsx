'use client';

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApiError } from '@/lib/api-client';
import { useTheme } from '@/hooks/use-theme';
import { summaryKeys } from '@/lib/summary-keys';

function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    // After any successful change, the dashboard and activity feed are out of date.
    mutationCache: new MutationCache({
      onSuccess: () => {
        for (const queryKey of Object.values(summaryKeys)) {
          void queryClient.invalidateQueries({ queryKey });
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30s, so switching pages doesn't refetch everything.
        staleTime: 30_000,
        // Retry network/server problems once, but never retry 4xx errors
        // (a 404 or 401 will not fix itself by asking again).
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) &&
          failureCount < 1,
      },
    },
  });
  return queryClient;
}

/**
 * Client-side providers shared by every page:
 * - TanStack Query: fetching, caching and loading/error states for API data
 * - Tooltips: needed by the sidebar's collapsed-mode labels
 * - Toaster: success/error notifications (toast.success('Saved'))
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  // useState makes sure each browser tab gets exactly one QueryClient.
  const [queryClient] = useState(createQueryClient);
  const { resolved } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster theme={resolved} position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
