'use client';

import { useQuery } from '@tanstack/react-query';
import type { IdeaPage } from '@/features/ideas/types';
import { ideaKeys } from '@/features/ideas/use-ideas';
import type { ActivityEntry } from '@/features/projects/types';
import { api } from '@/lib/api-client';
import { summaryKeys } from '@/lib/summary-keys';
import type { Dashboard } from './types';

/**
 * The dashboard summary. Refreshed when you come back to the tab (TanStack
 * Query's default) and after any change in the app (see AppProviders); never
 * on a timer.
 */
export function useDashboard() {
  return useQuery({
    queryKey: summaryKeys.dashboard,
    queryFn: () => api.get<Dashboard>('/dashboard'),
  });
}

export const RECENT_ACTIVITY_LIMIT = 10;

export function useRecentActivity() {
  return useQuery({
    queryKey: [...summaryKeys.activity, RECENT_ACTIVITY_LIMIT],
    queryFn: () =>
      api.get<ActivityEntry[]>(`/activity?limit=${RECENT_ACTIVITY_LIMIT}`),
  });
}

export function useRecentIdeas() {
  return useQuery({
    // Not under ideaKeys.lists(): the favourite toggle rewrites those as infinite data.
    queryKey: [...ideaKeys.all, 'recent'],
    queryFn: () => api.get<IdeaPage>('/ideas?sort=createdAt&pageSize=5'),
    select: (page) => page.data,
  });
}
