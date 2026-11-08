import type { JSONContent } from '@tiptap/react';
import type { PageMeta } from '@/features/ideas/types';
import type { CategoryRef, TagRef, TitleRef } from '@/features/library/types';

/** Mirrors the ideabloom-api note responses (see the API README, "Notes"). */

export interface NoteSummary {
  id: string;
  title: string;
  /** The first ~200 characters of the text. */
  excerpt: string;
  isPinned: boolean;
  category: CategoryRef | null;
  tags: TagRef[];
  idea: TitleRef | null;
  project: TitleRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note extends Omit<NoteSummary, 'excerpt'> {
  /** Tiptap editor JSON. Always shown with the editor, never as HTML. */
  content: JSONContent;
}

export interface NotePage {
  data: NoteSummary[];
  meta: PageMeta;
}

export interface NoteInput {
  title?: string;
  content?: JSONContent;
  isPinned?: boolean;
  categoryId?: string | null;
  tags?: string[];
  ideaId?: string | null;
  projectId?: string | null;
}
