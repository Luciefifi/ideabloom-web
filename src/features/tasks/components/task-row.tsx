'use client';

import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityIndicator } from '@/features/ideas/components/idea-badges';
import { cn } from '@/lib/utils';
import { formatDue, TASK_STATUS_LABELS } from '../task-styles';
import type { Subtask, TaskStatus, TaskSummary } from '../types';
import { useCreateTask, useTask, useUpdateTask } from '../use-tasks';

/** Done ↔ To do with one click. */
function TaskCheckbox({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: TaskStatus;
}) {
  const update = useUpdateTask();
  return (
    <input
      type="checkbox"
      checked={status === 'done'}
      disabled={update.isPending}
      aria-label={
        status === 'done' ? `Reopen "${title}"` : `Complete "${title}"`
      }
      onChange={(e) =>
        update.mutate(
          { id, status: e.target.checked ? 'done' : 'todo' },
          {
            onError: (err) =>
              toast.error(`Couldn't update. ${errorMessage(err)}`),
          },
        )
      }
      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--lavender-deep)]"
    />
  );
}

function DueDate({ dueDate, overdue }: { dueDate: string; overdue: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        overdue && 'font-medium text-destructive',
      )}
    >
      <CalendarIcon className="size-3" aria-hidden="true" />
      {overdue && (
        <>
          <span className="sr-only">Overdue,</span>{' '}
        </>
      )}
      {formatDue(dueDate)}
    </span>
  );
}

/** A task's subtasks with checkboxes, plus "add a subtask". */
export function SubtaskList({
  parentId,
  className,
}: {
  parentId: string;
  className?: string;
}) {
  const task = useTask(parentId);
  const create = useCreateTask();
  const [title, setTitle] = useState('');

  if (task.isPending) return <Skeleton className="ml-7 h-16" />;
  if (!task.data) return null;

  return (
    <div className={cn('space-y-1', className ?? 'mt-2 ml-7 border-l pl-3')}>
      <ul aria-label={`Subtasks of ${task.data.title}`} className="space-y-1">
        {task.data.subtaskList.map((sub: Subtask) => (
          <li key={sub.id} className="flex items-start gap-2 text-sm">
            <TaskCheckbox id={sub.id} title={sub.title} status={sub.status} />
            <span
              className={cn(
                'flex-1',
                sub.status === 'done' && 'text-muted-foreground line-through',
              )}
            >
              {sub.title}
            </span>
            {sub.dueDate && (
              <span className="text-xs text-muted-foreground">
                <DueDate dueDate={sub.dueDate} overdue={sub.isOverdue} />
              </span>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          create.mutate(
            { title: title.trim(), parentTaskId: parentId },
            {
              onSuccess: () => setTitle(''),
              onError: (err) =>
                toast.error(`Couldn't add. ${errorMessage(err)}`),
            },
          );
        }}
      >
        <label htmlFor={`subtask-${parentId}`} className="sr-only">
          New subtask
        </label>
        <Input
          id={`subtask-${parentId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a subtask… (Enter)"
          maxLength={200}
          className="h-8 text-sm"
        />
      </form>
    </div>
  );
}

interface TaskRowProps {
  task: TaskSummary;
  /** Opens the task's side panel. */
  onOpen: (id: string) => void;
  /** Hide the project chip (e.g. on a project's own page). */
  hideProject?: boolean;
}

export function TaskRow({ task, onOpen, hideProject }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const done = task.status === 'done';

  return (
    <div className="rounded-lg px-2 py-2 hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <TaskCheckbox id={task.id} title={task.title} status={task.status} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className={cn(
              'text-left text-sm font-medium break-words hover:underline focus-visible:underline focus-visible:outline-none',
              done && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {task.status === 'in_progress' && (
              <span className="font-medium text-sky-700 dark:text-sky-300">
                {TASK_STATUS_LABELS.in_progress}
              </span>
            )}
            {task.priority && <PriorityIndicator priority={task.priority} />}
            {task.dueDate && (
              <DueDate dueDate={task.dueDate} overdue={task.isOverdue} />
            )}
            {task.project && !hideProject && (
              <Link
                href={`/projects/${task.project.id}`}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <FolderIcon className="size-3" aria-hidden="true" />
                {task.project.title}
              </Link>
            )}
            {task.subtasks.total > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-0.5 hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDownIcon className="size-3" aria-hidden="true" />
                ) : (
                  <ChevronRightIcon className="size-3" aria-hidden="true" />
                )}
                {task.subtasks.completed}/{task.subtasks.total} subtasks
              </button>
            )}
          </div>
        </div>
      </div>
      {expanded && <SubtaskList parentId={task.id} />}
    </div>
  );
}
