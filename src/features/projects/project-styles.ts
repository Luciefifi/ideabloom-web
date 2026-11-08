import { format, parseISO } from 'date-fns';
import type { ProjectStatus } from './types';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: 'Not started',
  planning: 'Planning',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Dark text on light backgrounds (all well above 4.5:1 contrast). */
export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  not_started:
    'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  planning: 'bg-lavender-soft text-lavender-deep',
  in_progress: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
  on_hold:
    'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300',
  completed:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
};

/**
 * "2026-12-31" → "31 Dec 2026". parseISO reads a date-only string as a LOCAL
 * calendar day, so it never shifts to the 30th in time zones west of UTC.
 */
export function formatDay(date: string, pattern = 'd MMM yyyy'): string {
  return format(parseISO(date), pattern);
}
