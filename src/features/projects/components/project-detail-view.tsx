'use client';

import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  PencilIcon,
  SearchXIcon,
  Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  CategoryChip,
  PriorityIndicator,
} from '@/features/ideas/components/idea-badges';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { projectToFormValues } from '../project-form-schema';
import { formatDay, PROJECT_STATUS_LABELS } from '../project-styles';
import { PROJECT_STATUSES, type Project, type ProjectStatus } from '../types';
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from '../use-projects';
import { ProjectTasks } from '@/features/tasks/components/project-tasks';
import { MilestoneList } from './milestone-list';
import { ProjectActivity } from './project-activity';
import { progressCaption, ProjectStatusBadge } from './project-card';
import { ProjectForm } from './project-form';
import { RelatedIdeas } from './related-ideas';

function BackLink() {
  return (
    <Link
      href="/projects"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
    >
      <ArrowLeftIcon aria-hidden="true" />
      All projects
    </Link>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section
      aria-labelledby={id}
      className={cn('rounded-xl border bg-card p-5', className)}
    >
      <h2 id={id} className="mb-3 text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function ProjectDetailView() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id);

  if (project.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading project">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (project.isError) {
    const notFound =
      project.error instanceof ApiError &&
      [400, 404].includes(project.error.status);
    return (
      <div className="space-y-4">
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={SearchXIcon}
            title="Project not found"
            description="It may have been deleted, or the link is wrong."
          />
        ) : (
          <FormErrorAlert error={project.error} />
        )}
      </div>
    );
  }
  return <ProjectDetail project={project.data} />;
}

function ProjectDetail({ project }: { project: Project }) {
  const router = useRouter();
  const update = useUpdateProject(project.id);
  const statusChange = useUpdateProject(project.id);
  const remove = useDeleteProject(project.id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = project.status === 'completed';
  const closed = done || project.status === 'cancelled';
  // Everything progress is based on (tasks, else milestones) is done.
  const { basis, completed, total } = project.progress;
  const allWorkDone = basis !== 'none' && total > 0 && completed === total;

  const setStatus = (status: ProjectStatus) =>
    statusChange.mutate(
      { status },
      {
        onSuccess: () =>
          toast.success(`Status: ${PROJECT_STATUS_LABELS[status]}`),
        onError: (e) =>
          toast.error(`Couldn't change the status. ${errorMessage(e)}`),
      },
    );

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {project.category && <CategoryChip category={project.category} />}
            {project.priority && (
              <PriorityIndicator priority={project.priority} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            aria-label="Project status"
            value={project.status}
            disabled={statusChange.isPending}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden="true" />
            Edit
          </Button>
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogTrigger
              render={<Button variant="outline" className="text-destructive" />}
            >
              <Trash2Icon aria-hidden="true" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{project.title}&rdquo;, its{' '}
                  {plural(project.tasks.total, 'task')} (and their subtasks) and
                  its {plural(project.milestones.total, 'milestone')} will be
                  deleted permanently. Linked ideas are kept
                  {project.sourceIdea
                    ? `, and "${project.sourceIdea.title}" goes back to Planned`
                    : ''}
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={remove.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(undefined, {
                      onSuccess: () => {
                        toast.success(`Deleted "${project.title}"`);
                        router.push('/projects');
                      },
                      onError: (e) => {
                        setConfirmDelete(false);
                        toast.error(`Couldn't delete. ${errorMessage(e)}`);
                      },
                    })
                  }
                >
                  {remove.isPending && <Spinner aria-hidden="true" />}
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {allWorkDone && !closed && (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>All {basis} are done. Mark the project as completed?</span>
            <Button
              size="sm"
              onClick={() => setStatus('completed')}
              disabled={statusChange.isPending}
            >
              Mark completed
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Section title="Progress">
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tabular-nums">
              {project.progress.percent}%
            </span>
            <span className="text-sm text-muted-foreground">
              {progressCaption(project)}
            </span>
          </div>
          <ProgressBar
            percent={project.progress.percent}
            label="Project progress"
            complete={done}
            className="h-3"
          />
          <p className="text-xs text-muted-foreground">
            {done
              ? 'Completed projects count as 100%.'
              : project.progress.basis === 'tasks'
                ? 'Based on completed tasks (subtasks not counted).'
                : project.progress.basis === 'milestones'
                  ? 'Based on completed milestones. Add tasks and progress will be based on them.'
                  : 'Add tasks or milestones to track progress.'}
          </p>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Start</dt>
            <dd>{project.startDate ? formatDay(project.startDate) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Target</dt>
            <dd
              className={cn(
                project.isOverdue && 'font-medium text-destructive',
              )}
            >
              {project.targetDate ? formatDay(project.targetDate) : '—'}
              {project.isOverdue && ' · overdue'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd>
              {project.completedAt
                ? format(new Date(project.completedAt), 'd MMM yyyy')
                : '—'}
            </dd>
          </div>
        </dl>
      </Section>

      {(project.goals || project.description) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {project.goals && (
            <Section title="Goals">
              <p className="text-sm whitespace-pre-line">{project.goals}</p>
            </Section>
          )}
          {project.description && (
            <Section title="Description">
              <p className="text-sm whitespace-pre-line">
                {project.description}
              </p>
            </Section>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Section title="Tasks">
            <ProjectTasks projectId={project.id} />
          </Section>
          <Section title="Milestones">
            <MilestoneList project={project} />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Related ideas">
            <RelatedIdeas project={project} />
          </Section>
          <Section title="Activity">
            <ProjectActivity projectId={project.id} />
          </Section>
        </div>
      </div>

      <Sheet
        open={editing}
        onOpenChange={(open) => {
          setEditing(open);
          if (!open) update.reset();
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit project</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {editing && (
              <ProjectForm
                defaultValues={projectToFormValues(project)}
                categoryName={project.category?.name}
                submitLabel="Save changes"
                pendingLabel="Saving…"
                pending={update.isPending}
                error={update.error}
                requireChanges
                onCancel={() => setEditing(false)}
                onSubmit={(input) =>
                  update.mutate(input, {
                    onSuccess: () => {
                      setEditing(false);
                      toast.success('Project saved');
                    },
                  })
                }
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
