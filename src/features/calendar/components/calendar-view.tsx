'use client';

import { format, parseISO } from 'date-fns';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  FolderKanbanIcon,
  ListChecksIcon,
  PlayIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskPanel } from '@/features/tasks/components/task-panel';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { cn } from '@/lib/utils';
import {
  monthGrid,
  monthLabel,
  monthOf,
  parseMonth,
  shiftMonth,
  WEEKDAYS,
} from '../calendar-dates';
import type { CalendarEvent, CalendarEventKind } from '../types';
import { useCalendar } from '../use-calendar';

const KIND: Record<CalendarEventKind, { icon: LucideIcon; noun: string }> = {
  task: { icon: ListChecksIcon, noun: 'Task' },
  milestone: { icon: FlagIcon, noun: 'Milestone' },
  project_start: { icon: PlayIcon, noun: 'Project starts' },
  project_target: { icon: FolderKanbanIcon, noun: 'Project target' },
};

interface MonthFilter {
  month: string; // '' = this month
}

/** One item on the calendar. Tasks open the task panel; the rest open their project. */
function EventChip({
  event,
  onOpenTask,
}: {
  event: CalendarEvent;
  onOpenTask: (id: string) => void;
}) {
  const { icon: Icon, noun } = KIND[event.kind];
  const className = cn(
    'flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-xs hover:bg-lavender-soft focus-visible:outline-2 focus-visible:outline-ring',
    event.done && 'text-muted-foreground line-through opacity-70',
    event.overdue && 'bg-destructive/10 font-medium text-destructive',
  );
  const label = (
    <>
      {event.done ? (
        <CheckIcon className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <Icon className="size-3 shrink-0" aria-hidden="true" />
      )}
      {/* Spaces sit BETWEEN the pieces: screen readers drop spaces at the edge of an element. */}
      <span className="sr-only">{noun}:</span>{' '}
      <span className="truncate">{event.title}</span>
      {event.parent && (
        <>
          <span className="sr-only">,</span>{' '}
          <span className="sr-only">part of {event.parent.title}</span>
        </>
      )}
      {event.done && (
        <>
          {' '}
          <span className="sr-only">(done)</span>
        </>
      )}
      {event.overdue && (
        <>
          {' '}
          <span className="sr-only">(overdue)</span>
        </>
      )}
    </>
  );
  const title = [
    `${noun}: ${event.title}`,
    event.parent && `part of ${event.parent.title}`,
    event.project &&
    event.kind !== 'project_start' &&
    event.kind !== 'project_target'
      ? event.project.title
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return event.kind === 'task' ? (
    <button
      type="button"
      title={title}
      className={className}
      onClick={() => onOpenTask(event.id)}
    >
      {label}
    </button>
  ) : (
    <Link
      href={`/projects/${event.project?.id ?? event.id}`}
      title={title}
      className={className}
    >
      {label}
    </Link>
  );
}

export function CalendarView() {
  const { filters, updateFilter } = useUrlFilters<MonthFilter>({
    fromParams: (params) => ({ month: parseMonth(params.get('month')) ?? '' }),
    toParams: (f) => new URLSearchParams(f.month ? { month: f.month } : {}),
    defaults: { month: '' },
  });
  // This component only renders in the browser (it reads the URL inside Suspense),
  // so reading the clock here is safe.
  const thisMonth = monthOf(new Date());
  const month = filters.month || thisMonth;
  const grid = monthGrid(month);
  const calendar = useCalendar(grid.from, grid.to);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of calendar.data?.events ?? []) {
    byDay.set(event.date, [...(byDay.get(event.date) ?? []), event]);
  }
  const today = calendar.data?.today;
  const go = (target: string) =>
    updateFilter('month', target === thisMonth ? '' : target);
  const agendaDays = grid.weeks
    .flat()
    .filter((day) => day.startsWith(month) && byDay.has(day));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold" aria-live="polite">
          {monthLabel(month)}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => go(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            onClick={() => go(thisMonth)}
            disabled={month === thisMonth}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => go(shiftMonth(month, 1))}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      {calendar.isError && (
        <div className="space-y-3">
          <FormErrorAlert error={calendar.error} />
          <Button variant="outline" onClick={() => void calendar.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {calendar.isPending ? (
        <Skeleton
          className="h-[32rem] w-full rounded-xl"
          aria-label="Loading calendar"
        />
      ) : (
        <>
          {/* Month grid (tablets and larger) */}
          <table className="hidden w-full table-fixed border-collapse overflow-hidden rounded-xl border bg-card md:table">
            <caption className="sr-only">
              {monthLabel(month)}: tasks, milestones and project dates
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="border-b px-2 py-2 text-left text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.weeks.map((week) => (
                <tr key={week[0]}>
                  {week.map((day) => {
                    const inMonth = day.startsWith(month);
                    const isToday = day === today;
                    const events = byDay.get(day) ?? [];
                    return (
                      <td
                        key={day}
                        aria-current={isToday ? 'date' : undefined}
                        className={cn(
                          'h-28 border-t border-l p-1 align-top first:border-l-0',
                          !inMonth && 'bg-muted/40',
                        )}
                      >
                        <span
                          className={cn(
                            'mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs',
                            !inMonth && 'text-muted-foreground',
                            isToday &&
                              'bg-primary font-semibold text-primary-foreground',
                          )}
                        >
                          <span className="sr-only">
                            {format(parseISO(day), 'EEEE d MMMM')}
                          </span>
                          <span aria-hidden="true">
                            {format(parseISO(day), 'd')}
                          </span>
                        </span>
                        {events.length > 0 && (
                          <ul className="space-y-0.5">
                            {events.map((event) => (
                              <li key={`${event.kind}-${event.id}`}>
                                <EventChip
                                  event={event}
                                  onOpenTask={setOpenTaskId}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Agenda (phones) */}
          <div className="space-y-3 md:hidden">
            {agendaDays.length === 0 ? (
              <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                Nothing scheduled in {monthLabel(month)}.
              </p>
            ) : (
              agendaDays.map((day) => (
                <section
                  key={day}
                  aria-labelledby={`agenda-${day}`}
                  className="rounded-xl border bg-card p-3"
                >
                  <h3
                    id={`agenda-${day}`}
                    className={cn(
                      'mb-1 text-sm font-semibold',
                      day === today && 'text-primary',
                    )}
                  >
                    {format(parseISO(day), 'EEEE d MMMM')}
                    {day === today && ' · Today'}
                  </h3>
                  <ul className="space-y-1">
                    {(byDay.get(day) ?? []).map((event) => (
                      <li key={`${event.kind}-${event.id}`}>
                        <EventChip event={event} onOpenTask={setOpenTaskId} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </>
      )}

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {Object.values(KIND).map(({ icon: Icon, noun }) => (
          <span key={noun} className="inline-flex items-center gap-1">
            <Icon className="size-3" aria-hidden="true" />
            {noun}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <CheckIcon className="size-3" aria-hidden="true" />
          Done
        </span>
        <span className="font-medium text-destructive">Red = overdue</span>
      </p>

      <TaskPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}
