import {
  FileTextIcon,
  FolderKanbanIcon,
  LibraryIcon,
  LightbulbIcon,
  ListChecksIcon,
  type LucideIcon,
} from 'lucide-react';
import { plainText } from './highlight';
import type { SearchResult, SearchType } from './types';

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  idea: 'Ideas',
  project: 'Projects',
  task: 'Tasks',
  note: 'Notes',
  resource: 'Resources',
};

export const SEARCH_TYPE_ICONS: Record<SearchType, LucideIcon> = {
  idea: LightbulbIcon,
  project: FolderKanbanIcon,
  task: ListChecksIcon,
  note: FileTextIcon,
  resource: LibraryIcon,
};

/**
 * Where a result opens. Tasks and resources have no page of their own, so
 * they open their list filtered to that title.
 */
export function resultHref(result: SearchResult): string {
  const title = encodeURIComponent(plainText(result.title));
  switch (result.type) {
    case 'idea':
      return `/ideas/${result.id}`;
    case 'project':
      return `/projects/${result.id}`;
    case 'note':
      return `/notes/${result.id}`;
    case 'task':
      return `/tasks?view=all&search=${title}`;
    case 'resource':
      return `/resources?search=${title}`;
  }
}
