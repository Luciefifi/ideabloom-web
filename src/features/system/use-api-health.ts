'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';

/** Response of GET /api/v1/health (from @nestjs/terminus). */
export interface HealthResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string }>;
}

export type ApiHealthState =
  'checking' | 'online' | 'database-down' | 'offline';

export const healthQueryKey = ['system', 'health'] as const;

/** Checks the API every 30 seconds and summarises the result in one word. */
export function useApiHealth(): ApiHealthState {
  const { isPending, isError, error } = useQuery({
    queryKey: healthQueryKey,
    queryFn: () => api.get<HealthResponse>('/health'),
    refetchInterval: 30_000,
    retry: false,
  });

  if (isPending) return 'checking';
  if (!isError) return 'online';
  // 503 = the API answered, but its database check failed.
  if (error instanceof ApiError && error.status === 503) return 'database-down';
  return 'offline';
}
