import { addDays, format, parseISO } from 'date-fns';
import type { TaskStatus, TaskView } from './types';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const TASK_VIEW_LABELS: Record<TaskView, string> = {
  pending: 'Pending',
  overdue: 'Overdue',
  completed: 'Completed',
  all: 'All',
};

/** 'YYYY-MM-DD' for a local calendar day. */
export function localDay(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Friendly due date: "Today", "Tomorrow", "Yesterday", or "12 Nov" (with the
 * year when it isn't this year). Whether a task is OVERDUE comes from the API.
 */
export function formatDue(dueDate: string, now: Date = new Date()): string {
  if (dueDate === localDay(now)) return 'Today';
  if (dueDate === localDay(addDays(now, 1))) return 'Tomorrow';
  if (dueDate === localDay(addDays(now, -1))) return 'Yesterday';
  const date = parseISO(dueDate);
  return format(
    date,
    date.getFullYear() === now.getFullYear() ? 'd MMM' : 'd MMM yyyy',
  );
}
