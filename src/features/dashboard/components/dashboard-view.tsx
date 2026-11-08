'use client';

import { format, parseISO } from 'date-fns';
import {
  CalendarIcon,
  CheckCircle2Icon,
  FlagIcon,
  FolderKanbanIcon,
  LightbulbIcon,
  ListChecksIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/use-auth';
import { StatusBadge } from '@/features/ideas/components/idea-badges';
import { QuickCapture } from '@/features/ideas/components/quick-capture';
import { STATUS_LABELS } from '@/features/ideas/idea-styles';
import { IDEA_STATUSES } from '@/features/ideas/types';
import { progressCaption } from '@/features/projects/components/project-card';
import { TaskQuickAdd } from '@/features/tasks/components/task-quick-add';
import { formatDue } from '@/features/tasks/task-styles';
import { timeAgo } from '@/features/notes/note-styles';
import { cn } from '@/lib/utils';
import { describeActivity } from '../activity-text';
import type { Dashboard, Deadline } from '../types';
import {
  useDashboard,
  useRecentActivity,
  useRecentIdeas,
} from '../use-dashboard';
import { BarsChart } from './dashboard-charts';

function Card({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `dash-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section
      aria-labelledby={id}
      className={cn('rounded-xl border bg-card p-5 shadow-xs', className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-primary underline-offset-4 hover:underline"
    >
      {label}
    </Link>
  );
}

function greetingFor(hour: number): string {
  return hour < 12
    ? 'Good morning'
    : hour < 18
      ? 'Good afternoon'
      : 'Good evening';
}

function Greeting({ today }: { today?: string }) {
  const user = useCurrentUser();
  // The page is pre-rendered ahead of time, so the clock is only read once the
  // dashboard data has loaded in the browser (`today` is set); before that: "Welcome back".
  const greeting = today ? greetingFor(new Date().getHours()) : 'Welcome back';
  const name = user.data?.displayName?.trim();
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {greeting}
        {name ? `, ${name}` : ''}
      </h1>
      <p className="text-muted-foreground">
        {today ? format(parseISO(today), 'EEEE d MMMM yyyy') : ' '}
      </p>
    </header>
  );
}

function Stat({
  label,
  value,
  href,
  icon: Icon,
  alert,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-lavender focus-visible:border-lavender focus-visible:outline-none',
        alert && 'border-destructive/40 bg-destructive/5',
      )}
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-lg bg-lavender-soft text-lavender-deep',
          alert && 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-semibold tabular-nums">
          {value}
        </span>
        <span className="block text-sm text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

const DEADLINE_ICONS = {
  task: ListChecksIcon,
  milestone: FlagIcon,
  project: FolderKanbanIcon,
} as const;
const DEADLINE_NOUNS = {
  task: 'Task',
  milestone: 'Milestone',
  project: 'Project target',
} as const;

function deadlineHref(d: Deadline): string {
  if (d.kind === 'project') return `/projects/${d.id}`;
  if (d.project) return `/projects/${d.project.id}`;
  return '/tasks';
}

function DeadlineList({
  items,
  today,
  overdue,
}: {
  items: Deadline[];
  today: string;
  overdue?: boolean;
}) {
  return (
    <ul className="space-y-1">
      {items.map((d) => {
        const Icon = DEADLINE_ICONS[d.kind];
        return (
          <li key={`${d.kind}-${d.id}`}>
            <Link
              href={deadlineHref(d)}
              className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <Icon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="sr-only">{DEADLINE_NOUNS[d.kind]}:</span>{' '}
                <span className="block truncate text-sm font-medium">
                  {d.title}
                </span>
                {d.project && d.kind !== 'project' && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {d.project.title}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'shrink-0 text-xs text-muted-foreground',
                  overdue && 'font-medium text-destructive',
                )}
              >
                {formatDue(d.date, parseISO(today))}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Deadlines({ data }: { data: Dashboard }) {
  const { overdue, upcoming } = data.deadlines;
  return (
    <Card title="Deadlines" action={<SeeAll href="/tasks" label="All tasks" />}>
      {overdue.length === 0 && upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing due in the next 14 days. 🎉
        </p>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive">
                <TriangleAlertIcon className="size-4" aria-hidden="true" />
                Overdue
              </h3>
              <DeadlineList items={overdue} today={data.today} overdue />
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <CalendarIcon className="size-4" aria-hidden="true" />
                Next 14 days
              </h3>
              <DeadlineList items={upcoming} today={data.today} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ActiveProjects({ data }: { data: Dashboard }) {
  return (
    <Card
      title="Projects in progress"
      action={<SeeAll href="/projects" label="All projects" />}
    >
      {data.activeProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active projects. Turn an idea into a project to start.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.activeProjects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block space-y-1.5 rounded-lg p-1 hover:bg-muted"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {p.title}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {p.progress.percent}%
                  </span>
                </span>
                <ProgressBar
                  percent={p.progress.percent}
                  label={`${p.title} progress`}
                />
                <span className="block text-xs text-muted-foreground">
                  {progressCaption(p)}
                  {p.isOverdue && (
                    <span className="font-medium text-destructive">
                      {' '}
                      · past its target date
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function IdeasByStatus({ data }: { data: Dashboard }) {
  const bars = IDEA_STATUSES.map((s) => ({
    label: s === 'converted' ? 'Projects' : STATUS_LABELS[s],
    value: data.ideas.byStatus[s],
  }));
  const total = bars.reduce((sum, b) => sum + b.value, 0);
  return (
    <Card
      title="Ideas by status"
      action={<SeeAll href="/ideas" label="All ideas" />}
    >
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No ideas yet.</p>
      ) : (
        <>
          <BarsChart data={bars} layout="rows" valueLabel="Ideas" />
          <ul className="sr-only">
            {IDEA_STATUSES.map((s) => (
              <li key={s}>
                {STATUS_LABELS[s]}: {data.ideas.byStatus[s]}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function CompletedPerWeek({ data }: { data: Dashboard }) {
  const bars = data.completedPerWeek.map((w) => ({
    label: format(parseISO(w.weekStart), 'd MMM'),
    value: w.count,
  }));
  const total = bars.reduce((sum, b) => sum + b.value, 0);
  const thisWeek = bars.at(-1)?.value ?? 0;
  return (
    <Card title="Tasks completed">
      <p className="mb-2 text-sm text-muted-foreground">
        {thisWeek} this week · {total} in the last 8 weeks
      </p>
      <BarsChart data={bars} valueLabel="Tasks completed" />
      <table className="sr-only">
        <caption>Tasks completed per week (weeks start on Monday)</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Completed</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.label}>
              <td>{b.label}</td>
              <td>{b.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function RecentActivity() {
  const activity = useRecentActivity();
  return (
    <Card title="Recent activity">
      {activity.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : activity.isError ? (
        <FormErrorAlert error={activity.error} />
      ) : activity.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      ) : (
        <ol className="space-y-2">
          {activity.data.map((entry) => {
            const line = describeActivity(entry);
            const body = (
              <>
                <span className="block text-sm">{line.text}</span>
                <span className="block text-xs text-muted-foreground">
                  {line.context ? `${line.context} · ` : ''}
                  {timeAgo(entry.createdAt)}
                </span>
              </>
            );
            return (
              <li key={entry.id}>
                {line.href ? (
                  <Link
                    href={line.href}
                    className="block rounded-lg px-2 py-1 hover:bg-muted"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="px-2 py-1">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function RecentIdeas() {
  const ideas = useRecentIdeas();
  return (
    <Card
      title="Recently added ideas"
      action={<SeeAll href="/ideas" label="All ideas" />}
    >
      {ideas.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : ideas.isError ? (
        <FormErrorAlert error={ideas.error} />
      ) : ideas.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No ideas yet. Capture one above.
        </p>
      ) : (
        <ul className="space-y-1">
          {ideas.data.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/ideas/${idea.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                <span className="truncate text-sm font-medium">
                  {idea.title}
                </span>
                <StatusBadge status={idea.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DashboardView() {
  const dashboard = useDashboard();
  const data = dashboard.data;

  return (
    <div className="space-y-6">
      <Greeting today={data?.today} />

      <div className="grid gap-3 lg:grid-cols-2">
        <QuickCapture />
        <TaskQuickAdd />
      </div>

      {dashboard.isPending ? (
        <div
          className="space-y-6"
          aria-busy="true"
          aria-label="Loading dashboard"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : dashboard.isError || !data ? (
        <div className="space-y-3">
          <FormErrorAlert error={dashboard.error} />
          <Button variant="outline" onClick={() => void dashboard.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <nav
            aria-label="At a glance"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Stat
              label="Active ideas"
              value={data.ideas.active}
              href="/ideas"
              icon={LightbulbIcon}
            />
            <Stat
              label="Active projects"
              value={data.projects.active}
              href="/projects"
              icon={FolderKanbanIcon}
            />
            <Stat
              label={
                data.tasks.dueToday
                  ? `Pending tasks · ${data.tasks.dueToday} due today`
                  : 'Pending tasks'
              }
              value={data.tasks.pending}
              href="/tasks"
              icon={CheckCircle2Icon}
            />
            <Stat
              label="Overdue tasks"
              value={data.tasks.overdue}
              href="/tasks?view=overdue"
              icon={TriangleAlertIcon}
              alert={data.tasks.overdue > 0}
            />
          </nav>

          <div className="grid gap-6 lg:grid-cols-2">
            <Deadlines data={data} />
            <ActiveProjects data={data} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <IdeasByStatus data={data} />
            <CompletedPerWeek data={data} />
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <RecentIdeas />
      </div>
    </div>
  );
}
