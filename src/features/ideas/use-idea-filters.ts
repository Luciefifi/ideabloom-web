'use client';

import { useUrlFilters } from '@/hooks/use-url-filters';
import { DEFAULT_FILTERS, filtersFromParams, filtersToParams } from './filters';

/** The Ideas page filters (from the URL) and ways to change them. */
export function useIdeaFilters() {
  return useUrlFilters({
    fromParams: filtersFromParams,
    toParams: filtersToParams,
    defaults: DEFAULT_FILTERS,
  });
}
