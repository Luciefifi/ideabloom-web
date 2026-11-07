import type { CategoryColor, IdeaPriority, IdeaStatus } from './types';

/**
 * Labels and colours in one place. Every chip is dark text on a light
 * background (well above the 4.5:1 contrast needed for small text).
 */

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  inbox: 'Inbox',
  exploring: 'Exploring',
  planned: 'Planned',
  converted: 'Converted to project',
};

export const STATUS_STYLES: Record<IdeaStatus, string> = {
  inbox: 'bg-slate-100 text-slate-700',
  exploring: 'bg-sky-100 text-sky-800',
  planned: 'bg-lavender-soft text-lavender-deep',
  converted: 'bg-emerald-100 text-emerald-800',
};

export const PRIORITY_LABELS: Record<IdeaPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** Coloured dot next to the priority label. */
export const PRIORITY_DOTS: Record<IdeaPriority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
};

export const CATEGORY_STYLES: Record<
  CategoryColor,
  { chip: string; dot: string }
> = {
  lavender: { chip: 'bg-lavender-soft text-lavender-deep', dot: 'bg-lavender' },
  rose: { chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  amber: { chip: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  emerald: { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  sky: { chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  teal: { chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  orange: { chip: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  slate: { chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
};

/** Falls back to lavender if the API ever sends an unknown colour. */
export function categoryStyle(color: string) {
  return CATEGORY_STYLES[color as CategoryColor] ?? CATEGORY_STYLES.lavender;
}
