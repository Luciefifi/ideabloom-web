import type { IdeaStatus } from '@/features/ideas/types';
import type { TitleRef } from '@/features/library/types';
import type { ProjectSummary } from '@/features/projects/types';

/** Mirrors GET /api/v1/dashboard (see the API README, "Dashboard"). */

export type DeadlineKind = 'task' | 'milestone' | 'project';

export interface Deadline {
  kind: DeadlineKind;
  id: string;
  title: string;
  /** 'YYYY-MM-DD' */
  date: string;
  /** The project it belongs to (for a project deadline: the project itself). */
  project: TitleRef | null;
}

export interface Dashboard {
  /** Today in the user's time zone, 'YYYY-MM-DD'. */
  today: string;
  upcomingUntil: string;
  ideas: { active: number; byStatus: Record<IdeaStatus, number> };
  projects: { active: number; completed: number };
  tasks: { pending: number; overdue: number; dueToday: number };
  deadlines: { overdue: Deadline[]; upcoming: Deadline[] };
  activeProjects: ProjectSummary[];
  completedPerWeek: { weekStart: string; count: number }[];
}
