export const NOTE_SORTS = ['updatedAt', 'createdAt', 'title'] as const;
export type NoteSort = (typeof NOTE_SORTS)[number];

/** Filters on the Notes page; they live in the URL (defaults left out). */
export interface NoteFilters {
  search: string;
  categoryId: string; // '' = any, 'none' = uncategorized
  tagId: string;
  pinned: '' | 'true';
  sort: NoteSort | '';
  /** Not in the URL: used by the idea/project pages. */
  ideaId?: string;
  projectId?: string;
}

export const DEFAULT_NOTE_FILTERS: NoteFilters = {
  search: '',
  categoryId: '',
  tagId: '',
  pinned: '',
  sort: '',
};

export function noteFiltersFromParams(params: URLSearchParams): NoteFilters {
  const sort = params.get('sort');
  return {
    search: params.get('search') ?? '',
    categoryId: params.get('categoryId') ?? '',
    tagId: params.get('tagId') ?? '',
    pinned: params.get('pinned') === 'true' ? 'true' : '',
    sort: (NOTE_SORTS as readonly string[]).includes(sort ?? '')
      ? (sort as NoteSort)
      : '',
  };
}

export function noteFiltersToParams(filters: NoteFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of [
    'search',
    'categoryId',
    'tagId',
    'pinned',
    'sort',
    'ideaId',
    'projectId',
  ] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}

export function hasActiveNoteFilters(filters: NoteFilters): boolean {
  return Boolean(
    filters.search ||
    filters.categoryId ||
    filters.tagId ||
    filters.pinned ||
    filters.sort,
  );
}
