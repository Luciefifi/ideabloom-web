'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { SearchResponse, SearchType } from './types';

export interface SearchOptions {
  types?: SearchType[];
  limit?: number;
  includeArchived?: boolean;
}

export function searchParams(q: string, options: SearchOptions = {}) {
  const params = new URLSearchParams({ q });
  if (options.types?.length) params.set('types', options.types.join(','));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.includeArchived) params.set('includeArchived', 'true');
  return params;
}

/** Searches once there's something to search for (keeps old results while typing). */
export function useSearch(q: string, options: SearchOptions = {}) {
  const query = q.trim();
  return useQuery({
    queryKey: ['search', query, options],
    queryFn: () =>
      api.get<SearchResponse>(
        `/search?${searchParams(query, options).toString()}`,
      ),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
