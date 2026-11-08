'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Keeps a page's filters in the URL (?status=…&sort=…), so the back button
 * works and filtered views can be bookmarked. Each page provides how to read
 * and write its own filter object.
 */
export function useUrlFilters<F extends object>(options: {
  fromParams: (params: URLSearchParams) => F;
  toParams: (filters: F) => URLSearchParams;
  defaults: F;
}) {
  const { fromParams, toParams, defaults } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => fromParams(new URLSearchParams(searchParams.toString())),
    [fromParams, searchParams],
  );

  const setFilters = useCallback(
    (next: F) => {
      const query = toParams(next).toString();
      // replace (not push): each keystroke in search shouldn't add a history entry.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, toParams],
  );

  const updateFilter = useCallback(
    <K extends keyof F>(key: K, value: F[K]) =>
      setFilters({ ...filters, [key]: value }),
    [filters, setFilters],
  );

  const clearFilters = useCallback(
    () => setFilters(defaults),
    [defaults, setFilters],
  );

  return { filters, setFilters, updateFilter, clearFilters };
}
