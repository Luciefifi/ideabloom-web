import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK = { weekStartsOn: 1 } as const; // weeks start on Monday (approved)

/** 'YYYY-MM' for a date. */
export const monthOf = (date: Date) => format(date, 'yyyy-MM');

/** A valid 'YYYY-MM' from the URL, or null. */
export function parseMonth(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const date = parse(value, 'yyyy-MM', new Date(2000, 0, 1));
  return isValid(date) ? value : null;
}

export function shiftMonth(month: string, by: number): string {
  return monthOf(addMonths(parse(month, 'yyyy-MM', new Date(2000, 0, 1)), by));
}

export function monthLabel(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date(2000, 0, 1)), 'MMMM yyyy');
}

/**
 * The days shown for a month: whole weeks from the Monday on or before the 1st
 * to the Sunday on or after the last day (28–42 days, always fits the API's 45).
 */
export function monthGrid(month: string): {
  from: string;
  to: string;
  weeks: string[][];
} {
  const first = parse(month, 'yyyy-MM', new Date(2000, 0, 1));
  const start = startOfWeek(startOfMonth(first), WEEK);
  const end = endOfWeek(endOfMonth(first), WEEK);
  const weeks: string[][] = [];
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) =>
        format(addDays(day, i), 'yyyy-MM-dd'),
      ),
    );
  }
  return {
    from: format(start, 'yyyy-MM-dd'),
    to: format(end, 'yyyy-MM-dd'),
    weeks,
  };
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
