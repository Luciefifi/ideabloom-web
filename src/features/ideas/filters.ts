import {
  IDEA_PRIORITIES,
  IDEA_STATUSES,
  type IdeaPriority,
  type IdeaStatus,
} from './types';

/**
 * The filters on the Ideas page. They live in the URL
 * (/ideas?status=exploring&tagId=…), so the back button works and a filtered
 * view can be bookmarked. Default values are left out of the URL.
 */
export interface IdeaFilters {
  search: string;
  status: IdeaStatus | '';
  priority: IdeaPriority | 'none' | '';
  categoryId: string; // '' = any, 'none' = uncategorized
  tagId: string;
  favorite: boolean;
  archived: 'false' | 'true' | 'all';
  sort: IdeaSort | '';
}

export const IDEA_SORTS = [
  'updatedAt',
  'createdAt',
  'title',
  'priority',
  'relevance',
] as const;
export type IdeaSort = (typeof IDEA_SORTS)[number];

export const DEFAULT_FILTERS: IdeaFilters = {
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  tagId: '',
  favorite: false,
  archived: 'false',
  sort: '',
};

const oneOf = <T extends string>(list: readonly T[], value: string | null) =>
  value !== null && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;

/** Reads filters from the URL, ignoring anything unexpected. */
export function filtersFromParams(params: URLSearchParams): IdeaFilters {
  return {
    search: params.get('search') ?? '',
    status: oneOf(IDEA_STATUSES, params.get('status')) ?? '',
    priority: oneOf([...IDEA_PRIORITIES, 'none'], params.get('priority')) ?? '',
    categoryId: params.get('categoryId') ?? '',
    tagId: params.get('tagId') ?? '',
    favorite: params.get('favorite') === 'true',
    archived:
      oneOf(['false', 'true', 'all'], params.get('archived')) ?? 'false',
    sort: oneOf(IDEA_SORTS, params.get('sort')) ?? '',
  };
}

/** Filters → URL query string, without defaults ("" when nothing is filtered). */
export function filtersToParams(filters: IdeaFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters) as [
    keyof IdeaFilters,
    IdeaFilters[keyof IdeaFilters],
  ][]) {
    if (value !== DEFAULT_FILTERS[key] && value !== '') {
      params.set(key, String(value));
    }
  }
  return params;
}

/** True when anything differs from the defaults (shows "Clear filters"). */
export function hasActiveFilters(filters: IdeaFilters): boolean {
  return filtersToParams(filters).size > 0;
}
