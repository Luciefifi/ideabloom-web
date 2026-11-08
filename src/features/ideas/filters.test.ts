import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
} from './filters';

describe('idea filters <-> URL', () => {
  it('reads filters from the URL', () => {
    const filters = filtersFromParams(
      new URLSearchParams(
        'search=plant&status=exploring&priority=none&favorite=true&archived=all&sort=title',
      ),
    );

    expect(filters).toEqual({
      ...DEFAULT_FILTERS,
      search: 'plant',
      status: 'exploring',
      priority: 'none',
      favorite: true,
      archived: 'all',
      sort: 'title',
    });
  });

  it('ignores unexpected values instead of breaking', () => {
    const filters = filtersFromParams(
      new URLSearchParams(
        'status=done&priority=critical&archived=maybe&sort=random',
      ),
    );

    expect(filters).toEqual(DEFAULT_FILTERS);
  });

  it('writes only non-default values to the URL', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
    expect(
      filtersToParams({
        ...DEFAULT_FILTERS,
        status: 'planned',
        favorite: true,
      }).toString(),
    ).toBe('status=planned&favorite=true');
  });

  it('round-trips', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      search: 'a b',
      categoryId: 'none',
      archived: 'true' as const,
    };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });

  it('knows when anything is filtered', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, tagId: 'x' })).toBe(true);
  });
});
