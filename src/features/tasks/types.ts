import type { PageMeta } from '@/features/ideas/types';

/** Mirrors the ideabloom-api task responses (see the API README, "Tasks"). */

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_VIEWS = ['pending', 'overdue', 'completed', 'all'] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  dueDate: string | null;
  completedAt: string | null;
  isOverdue: boolean;
  position: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  startDate: string | null; // 'YYYY-MM-DD'
  dueDate: string | null; // 'YYYY-MM-DD'
  completedAt: string | null;
  isOverdue: boolean;
  project: { id: string; title: string } | null;
  parentTaskId: string | null;
  subtasks: { completed: number; total: number };
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task extends TaskSummary {
  description: string | null;
  parent: { id: string; title: string } | null;
  subtaskList: Subtask[];
}

export interface TaskPage {
  data: TaskSummary[];
  meta: PageMeta;
}

export interface TaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  startDate?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  parentTaskId?: string;
}
