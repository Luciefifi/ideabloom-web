import type { TitleRef } from '@/features/library/types';

/** Mirrors GET /api/v1/calendar (see the API README, "Calendar"). */

export type CalendarEventKind =
  'task' | 'milestone' | 'project_start' | 'project_target';

export interface CalendarEvent {
  kind: CalendarEventKind;
  id: string;
  title: string;
  /** 'YYYY-MM-DD' */
  date: string;
  done: boolean;
  overdue: boolean;
  project: TitleRef | null;
  /** For subtasks: the parent task. */
  parent: TitleRef | null;
}

export interface CalendarResponse {
  from: string;
  to: string;
  today: string;
  events: CalendarEvent[];
}
