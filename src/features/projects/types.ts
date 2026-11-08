import type { Category, PageMeta } from '@/features/ideas/types';

/** Mirrors the ideabloom-api project responses (see the API README, "Projects"). */

export const PROJECT_STATUSES = [
  'not_started',
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export interface Progress {
  percent: number;
  basis: 'tasks' | 'milestones' | 'none';
  completed: number;
  total: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // 'YYYY-MM-DD'
  completedAt: string | null;
  isOverdue: boolean;
  position: number;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: ProjectStatus;
  priority: ProjectPriority | null;
  category: Pick<Category, 'id' | 'name' | 'color'> | null;
  startDate: string | null; // 'YYYY-MM-DD'
  targetDate: string | null; // 'YYYY-MM-DD'
  completedAt: string | null;
  isOverdue: boolean;
  progress: Progress;
  milestones: { completed: number; total: number };
  createdAt: string;
  updatedAt: string;
}

export interface Project extends ProjectSummary {
  description: string | null;
  goals: string | null;
  sourceIdea: { id: string; title: string } | null;
  relatedIdeas: {
    id: string;
    title: string;
    status: string;
    isArchived: boolean;
  }[];
  milestoneList: Milestone[];
}

export interface ProjectPage {
  data: ProjectSummary[];
  meta: PageMeta;
}

export interface ProjectInput {
  title?: string;
  description?: string | null;
  goals?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority | null;
  categoryId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface ConvertIdeaInput {
  title?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface MilestoneInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
}

/** One entry of a project's history (GET /projects/:id/activity). */
export interface ActivityEntry {
  id: string;
  entityType: 'idea' | 'project' | 'task';
  entityId: string;
  action: string;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}
