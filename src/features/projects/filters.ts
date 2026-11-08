import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectPriority,
  type ProjectStatus,
} from './types';

/** Filters on the Projects page; they live in the URL (defaults left out). */
export interface ProjectFilters {
  search: string;
  /** '' = active projects (default), 'all' = everything, or one status. */
  status: ProjectStatus | 'all' | '';
  priority: ProjectPriority | 'none' | '';
  categoryId: string;
  sort: ProjectSort | '';
}

export const PROJECT_SORTS = [
  'updatedAt',
  'createdAt',
  'title',
  'targetDate',
  'progress',
] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  sort: '',
};

const oneOf = <T extends string>(list: readonly T[], value: string | null) =>
  value !== null && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;

export function projectFiltersFromParams(
  params: URLSearchParams,
): ProjectFilters {
  return {
    search: params.get('search') ?? '',
    status: oneOf([...PROJECT_STATUSES, 'all'], params.get('status')) ?? '',
    priority:
      oneOf([...PROJECT_PRIORITIES, 'none'], params.get('priority')) ?? '',
    categoryId: params.get('categoryId') ?? '',
    sort: oneOf(PROJECT_SORTS, params.get('sort')) ?? '',
  };
}

/** Filters for the page URL (only what differs from the defaults). */
export function projectFiltersToParams(
  filters: ProjectFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

/** Filters → API query. "all" becomes scope=all; '' (active) is the API default. */
export function projectFiltersToApiParams(
  filters: ProjectFilters,
): URLSearchParams {
  const params = projectFiltersToParams(filters);
  if (filters.status === 'all') {
    params.delete('status');
    params.set('scope', 'all');
  }
  return params;
}

export function hasActiveProjectFilters(filters: ProjectFilters): boolean {
  return projectFiltersToParams(filters).size > 0;
}
