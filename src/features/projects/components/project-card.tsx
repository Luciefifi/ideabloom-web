import { AlertTriangleIcon, CalendarIcon, FlagIcon } from 'lucide-react';
import Link from 'next/link';
import { ProgressBar } from '@/components/shared/progress-bar';
import {
  CategoryChip,
  PriorityIndicator,
} from '@/features/ideas/components/idea-badges';
import { cn } from '@/lib/utils';
import {
  formatDay,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
} from '../project-styles';
import type { ProjectStatus, ProjectSummary } from '../types';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        PROJECT_STATUS_STYLES[status],
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

/** "2 of 4 tasks" / "3 of 5 milestones" / "Nothing to track yet". */
export function progressCaption(
  project: Pick<ProjectSummary, 'progress' | 'status'>,
): string {
  const { basis, completed, total } = project.progress;
  if (basis === 'none')
    return project.status === 'completed'
      ? 'Completed'
      : 'Nothing to track yet';
  return `${completed} of ${total} ${basis}`;
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const done = project.status === 'completed';

  return (
    <article
      aria-labelledby={`project-${project.id}-title`}
      className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-lavender/60"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        {project.category && <CategoryChip category={project.category} />}
        {project.priority && <PriorityIndicator priority={project.priority} />}
      </div>

      <h3
        id={`project-${project.id}-title`}
        className="leading-snug font-medium"
      >
        <Link
          href={`/projects/${project.id}`}
          className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {project.title}
        </Link>
      </h3>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progressCaption(project)}</span>
          <span className="font-medium text-foreground tabular-nums">
            {project.progress.percent}%
          </span>
        </div>
        <ProgressBar
          percent={project.progress.percent}
          label={`Progress of ${project.title}`}
          complete={done}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {project.targetDate && (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              project.isOverdue && 'font-medium text-destructive',
            )}
          >
            {project.isOverdue ? (
              <AlertTriangleIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <CalendarIcon className="size-3.5" aria-hidden="true" />
            )}
            {project.isOverdue ? 'Overdue · was due ' : 'Due '}
            {formatDay(project.targetDate)}
          </span>
        )}
        {project.milestones.total > 0 && (
          <span className="inline-flex items-center gap-1">
            <FlagIcon className="size-3.5" aria-hidden="true" />
            {project.milestones.completed}/{project.milestones.total} milestones
          </span>
        )}
      </div>
    </article>
  );
}
