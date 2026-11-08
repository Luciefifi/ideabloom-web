'use client';

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDelete } from '@/features/ideas/components/confirm-delete';
import { cn } from '@/lib/utils';
import { formatDay } from '../project-styles';
import type { Milestone, Project } from '../types';
import {
  useAddMilestone,
  useDeleteMilestone,
  useReorderMilestones,
  useUpdateMilestone,
} from '../use-projects';

const dateInput =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

/** Title + optional due date, used for adding and for editing. */
function MilestoneEditor({
  idPrefix,
  initialTitle = '',
  initialDueDate = '',
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initialTitle?: string;
  initialDueDate?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (title: string, dueDate: string | null) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [dueDate, setDueDate] = useState(initialDueDate);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onSubmit(title.trim(), dueDate || null);
      }}
    >
      <label htmlFor={`${idPrefix}-title`} className="sr-only">
        Milestone title
      </label>
      <Input
        id={`${idPrefix}-title`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="e.g. Beta with 20 gardeners"
        className="h-9 flex-1"
      />
      <label htmlFor={`${idPrefix}-due`} className="sr-only">
        Due date (optional)
      </label>
      <input
        id={`${idPrefix}-due`}
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className={dateInput}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!title.trim() || pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function MilestoneRow({
  milestone,
  index,
  count,
  onMove,
  moving,
}: {
  milestone: Milestone;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  moving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateMilestone();
  const remove = useDeleteMilestone();
  const done = milestone.completedAt !== null;
  const checkboxId = `milestone-${milestone.id}`;

  if (editing) {
    return (
      <li className="rounded-lg border p-3">
        <MilestoneEditor
          idPrefix={`edit-${milestone.id}`}
          initialTitle={milestone.title}
          initialDueDate={milestone.dueDate ?? ''}
          submitLabel="Save"
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(title, dueDate) =>
            update.mutate(
              { id: milestone.id, title, dueDate },
              {
                onSuccess: () => setEditing(false),
                onError: (e) =>
                  toast.error(`Couldn't save. ${errorMessage(e)}`),
              },
            )
          }
        />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
      <input
        id={checkboxId}
        type="checkbox"
        checked={done}
        disabled={update.isPending}
        onChange={(e) =>
          update.mutate(
            { id: milestone.id, completed: e.target.checked },
            {
              onError: (err) =>
                toast.error(`Couldn't update. ${errorMessage(err)}`),
            },
          )
        }
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--lavender-deep)]"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            'cursor-pointer text-sm font-medium break-words',
            done && 'text-muted-foreground line-through',
          )}
        >
          {milestone.title}
        </label>
        {milestone.dueDate && (
          <p
            className={cn(
              'text-xs text-muted-foreground',
              milestone.isOverdue && 'font-medium text-destructive',
            )}
          >
            {milestone.isOverdue ? 'Overdue · was due ' : 'Due '}
            {formatDay(milestone.dueDate)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Move "${milestone.title}" up`}
          disabled={index === 0 || moving}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUpIcon aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Move "${milestone.title}" down`}
          disabled={index === count - 1 || moving}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDownIcon aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit milestone "${milestone.title}"`}
          onClick={() => setEditing(true)}
        >
          <PencilIcon aria-hidden="true" />
        </Button>
        <ConfirmDelete
          title={`Delete milestone "${milestone.title}"`}
          description="This can't be undone. The project's progress will be recalculated."
          pending={remove.isPending}
          onConfirm={(close) =>
            remove.mutate(milestone.id, {
              onError: (e) =>
                toast.error(`Couldn't delete. ${errorMessage(e)}`),
              onSettled: close,
            })
          }
        />
      </div>
    </li>
  );
}

export function MilestoneList({ project }: { project: Project }) {
  const add = useAddMilestone(project.id);
  const reorder = useReorderMilestones(project.id);
  const [formKey, setFormKey] = useState(0);
  const milestones = project.milestoneList;

  const move = (from: number, to: number) => {
    const ids = milestones.map((m) => m.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorder.mutate(ids, {
      onError: (e) => toast.error(`Couldn't reorder. ${errorMessage(e)}`),
    });
  };

  return (
    <div className="space-y-4">
      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No milestones yet. Break the project into a few checkpoints; progress
          is calculated from them.
        </p>
      ) : (
        <ul className="space-y-1" aria-label="Milestones">
          {milestones.map((milestone, index) => (
            <MilestoneRow
              key={milestone.id}
              milestone={milestone}
              index={index}
              count={milestones.length}
              onMove={move}
              moving={reorder.isPending}
            />
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t pt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <PlusIcon className="size-4" aria-hidden="true" />
          Add a milestone
        </p>
        <FormErrorAlert error={add.error} />
        <MilestoneEditor
          key={formKey}
          idPrefix="new-milestone"
          submitLabel="Add"
          pending={add.isPending}
          onSubmit={(title, dueDate) =>
            add.mutate(
              { title, dueDate },
              { onSuccess: () => setFormKey((k) => k + 1) }, // fresh, empty form
            )
          }
        />
      </div>
    </div>
  );
}
