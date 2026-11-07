'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  DEFAULT_FILTERS,
  filtersFromParams,
  filtersToParams,
  type IdeaFilters,
} from './filters';

/** The current filters (from the URL) and a way to change them (updates the URL). */
export function useIdeaFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: IdeaFilters) => {
      const query = filtersToParams(next).toString();
      // replace (not push): each keystroke in search shouldn't add a history entry.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const updateFilter = useCallback(
    <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) =>
      setFilters({ ...filters, [key]: value }),
    [filters, setFilters],
  );

  const clearFilters = useCallback(
    () => setFilters(DEFAULT_FILTERS),
    [setFilters],
  );

  return { filters, updateFilter, clearFilters };
}
