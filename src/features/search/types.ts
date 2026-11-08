import type { TitleRef } from '@/features/library/types';

/** Mirrors GET /api/v1/search (see the API README, "Search"). */

export const SEARCH_TYPES = [
  'idea',
  'project',
  'task',
  'note',
  'resource',
] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/** The API wraps matching words in these private-use characters (never HTML). */
export const HIGHLIGHT_START = '';
export const HIGHLIGHT_END = '';

export interface SearchResult {
  type: SearchType;
  id: string;
  /** With highlight markers. */
  title: string;
  /** With highlight markers; null when the item has no text. */
  snippet: string | null;
  status?: string;
  archived?: boolean;
  pinned?: boolean;
  project?: TitleRef | null;
  url?: string;
  resourceType?: string;
  updatedAt: string;
}

export interface SearchGroup {
  type: SearchType;
  total: number;
  items: SearchResult[];
}

export interface SearchResponse {
  query: string;
  groups: SearchGroup[];
}
