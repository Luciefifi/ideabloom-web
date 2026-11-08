import type { PageMeta } from '@/features/ideas/types';
import type { CategoryRef, TagRef, TitleRef } from '@/features/library/types';

/** Mirrors the ideabloom-api resource responses (see the API README, "Resources"). */

export const RESOURCE_TYPES = [
  'website',
  'article',
  'video',
  'document',
  'other',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface Resource {
  id: string;
  title: string;
  url: string;
  /** e.g. "youtube.com" */
  domain: string;
  type: ResourceType;
  description: string | null;
  notes: string | null;
  category: CategoryRef | null;
  tags: TagRef[];
  idea: TitleRef | null;
  project: TitleRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePage {
  data: Resource[];
  meta: PageMeta;
}

export interface ResourceInput {
  title?: string;
  url?: string;
  type?: ResourceType;
  description?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  tags?: string[];
  ideaId?: string | null;
  projectId?: string | null;
}
