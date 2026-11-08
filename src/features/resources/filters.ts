import { RESOURCE_TYPES, type ResourceType } from './types';

export const RESOURCE_SORTS = ['updatedAt', 'createdAt', 'title'] as const;
export type ResourceSort = (typeof RESOURCE_SORTS)[number];

/** Filters on the Resources page; they live in the URL (defaults left out). */
export interface ResourceFilters {
  search: string;
  type: ResourceType | '';
  categoryId: string; // '' = any, 'none' = uncategorized
  tagId: string;
  sort: ResourceSort | '';
  /** Not in the URL: used by the idea/project pages. */
  ideaId?: string;
  projectId?: string;
}

export const DEFAULT_RESOURCE_FILTERS: ResourceFilters = {
  search: '',
  type: '',
  categoryId: '',
  tagId: '',
  sort: '',
};

const oneOf = <T extends string>(list: readonly T[], value: string | null) =>
  value !== null && (list as readonly string[]).includes(value)
    ? (value as T)
    : '';

export function resourceFiltersFromParams(
  params: URLSearchParams,
): ResourceFilters {
  return {
    search: params.get('search') ?? '',
    type: oneOf(RESOURCE_TYPES, params.get('type')),
    categoryId: params.get('categoryId') ?? '',
    tagId: params.get('tagId') ?? '',
    sort: oneOf(RESOURCE_SORTS, params.get('sort')),
  };
}

export function resourceFiltersToParams(
  filters: ResourceFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of [
    'search',
    'type',
    'categoryId',
    'tagId',
    'sort',
    'ideaId',
    'projectId',
  ] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}

export function hasActiveResourceFilters(filters: ResourceFilters): boolean {
  return Boolean(
    filters.search ||
    filters.type ||
    filters.categoryId ||
    filters.tagId ||
    filters.sort,
  );
}
