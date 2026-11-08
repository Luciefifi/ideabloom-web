/** Mirrors the ideabloom-api responses (see the API README, "Ideas"). */

export const IDEA_STATUSES = [
  'inbox',
  'exploring',
  'planned',
  'converted',
] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

/** Statuses a person can choose ("converted" is set by turning an idea into a project). */
export const EDITABLE_IDEA_STATUSES = [
  'inbox',
  'exploring',
  'planned',
] as const;

export const IDEA_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type IdeaPriority = (typeof IDEA_PRIORITIES)[number];

export const CATEGORY_COLORS = [
  'lavender',
  'rose',
  'amber',
  'emerald',
  'sky',
  'teal',
  'orange',
  'slate',
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  ideaCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  ideaCount?: number;
}

export interface IdeaLink {
  id: string;
  url: string;
  label: string | null;
}

interface IdeaBase {
  id: string;
  title: string;
  status: IdeaStatus;
  priority: IdeaPriority | null;
  isFavorite: boolean;
  archivedAt: string | null;
  category: Pick<Category, 'id' | 'name' | 'color'> | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

/** An idea as shown in lists. */
export interface IdeaSummary extends IdeaBase {
  excerpt: string | null;
  linkCount: number;
}

/** A full idea, for the detail page. */
export interface Idea extends IdeaBase {
  description: string | null;
  links: IdeaLink[];
  /** The project this idea was turned into or is linked to. */
  project: { id: string; title: string } | null;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IdeaPage {
  data: IdeaSummary[];
  meta: PageMeta;
}

export interface IdeaInput {
  title?: string;
  description?: string | null;
  status?: IdeaStatus;
  priority?: IdeaPriority | null;
  categoryId?: string | null;
  tags?: string[];
  links?: { url: string; label?: string | null }[];
  isFavorite?: boolean;
}
