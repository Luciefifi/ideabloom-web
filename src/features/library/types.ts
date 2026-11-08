import type { Category } from '@/features/ideas/types';

/**
 * Shared by notes and resources ("library" items): what they're attached to
 * and how they're organised. Mirrors the ideabloom-api responses.
 */
export interface TitleRef {
  id: string;
  title: string;
}

export type CategoryRef = Pick<Category, 'id' | 'name' | 'color'>;

export interface TagRef {
  id: string;
  name: string;
}

/** At most one of the two is set (the API enforces it). */
export interface Attachment {
  ideaId: string | null;
  projectId: string | null;
}

export function attachmentOf(item: {
  idea: TitleRef | null;
  project: TitleRef | null;
}): Attachment {
  return { ideaId: item.idea?.id ?? null, projectId: item.project?.id ?? null };
}
