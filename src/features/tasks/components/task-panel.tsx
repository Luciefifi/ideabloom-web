'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { TextField } from '@/components/forms/text-field';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDelete } from '@/features/ideas/components/confirm-delete';
import { PRIORITY_LABELS } from '@/features/ideas/idea-styles';
import { TASK_STATUS_LABELS } from '../task-styles';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '../types';
import { useProjectOptions } from '../use-project-options';
import { useDeleteTask, useTask, useUpdateTask } from '../use-tasks';
import { SubtaskList } from './task-row';

const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Use at most 200 characters'),
    description: z.string().max(10_000),
    status: z.enum(TASK_STATUSES),
    priority: z.enum([...TASK_PRIORITIES, '']),
    projectId: z.string(),
    startDate: z.string(),
    dueDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    message: "The due date can't be before the start date",
    path: ['dueDate'],
  });
type TaskFormValues = z.infer<typeof taskFormSchema>;

const dateInput =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive';

function TaskEditor({ task, onDone }: { task: Task; onDone: () => void }) {
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const projects = useProjectOptions();
  const isSubtask = task.parentTaskId !== null;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority ?? '',
      projectId: task.project?.id ?? '',
      startDate: task.startDate ?? '',
      dueDate: task.dueDate ?? '',
    },
  });

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={handleSubmit((v) =>
          update.mutate(
            {
              id: task.id,
              title: v.title,
              description: v.description.trim() || null,
              status: v.status,
              priority: v.priority || null,
              startDate: v.startDate || null,
              dueDate: v.dueDate || null,
              // Subtasks always follow their parent's project.
              ...(!isSubtask && { projectId: v.projectId || null }),
            },
            { onSuccess: () => toast.success('Task saved') },
          ),
        )}
      >
        <FieldGroup>
          <FormErrorAlert error={update.error} />
          <TextField
            id="task-title"
            label="Title"
            error={errors.title}
            {...register('title')}
          />
          <Field>
            <FieldLabel htmlFor="task-description">Notes</FieldLabel>
            <Textarea
              id="task-description"
              rows={3}
              {...register('description')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="task-status">Status</FieldLabel>
              <NativeSelect
                id="task-status"
                className="w-full"
                {...register('status')}
              >
                {TASK_STATUSES.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
              <NativeSelect
                id="task-priority"
                className="w-full"
                {...register('priority')}
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {TASK_PRIORITIES.map((p) => (
                  <NativeSelectOption key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-start">Start date</FieldLabel>
              <input
                id="task-start"
                type="date"
                className={dateInput}
                {...register('startDate')}
              />
            </Field>
            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel htmlFor="task-due">Due date</FieldLabel>
              <input
                id="task-due"
                type="date"
                aria-invalid={!!errors.dueDate}
                className={dateInput}
                {...register('dueDate')}
              />
              <FieldError errors={[errors.dueDate]} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="task-project">Project</FieldLabel>
            {/* Controlled: the project list may load after the form appears. */}
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <NativeSelect
                  id="task-project"
                  className="w-full"
                  disabled={isSubtask}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <NativeSelectOption value="">No project</NativeSelectOption>
                  {task.project &&
                    !projects.data?.some((p) => p.id === task.project?.id) && (
                      <NativeSelectOption value={task.project.id}>
                        {task.project.title}
                      </NativeSelectOption>
                    )}
                  {(projects.data ?? []).map((p) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      {p.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
            {isSubtask && (
              <FieldDescription>
                Subtasks always belong to their parent task&apos;s project.
              </FieldDescription>
            )}
          </Field>
          <div className="flex items-center justify-between gap-2">
            <ConfirmDelete
              title={`Delete task "${task.title}"`}
              description={
                task.subtaskList.length
                  ? `Its ${task.subtaskList.length} subtask${task.subtaskList.length === 1 ? '' : 's'} will be deleted too.`
                  : "This can't be undone."
              }
              pending={remove.isPending}
              onConfirm={(close) =>
                remove.mutate(
                  { id: task.id, parentTaskId: task.parentTaskId },
                  {
                    onSuccess: () => {
                      toast.success(`Deleted "${task.title}"`);
                      onDone();
                    },
                    onError: (e) =>
                      toast.error(`Couldn't delete. ${errorMessage(e)}`),
                    onSettled: close,
                  },
                )
              }
            />
            <Button type="submit" disabled={!isDirty || update.isPending}>
              {update.isPending && <Spinner aria-hidden="true" />}
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </FieldGroup>
      </form>

      {!isSubtask && (
        <section aria-labelledby="task-subtasks-heading">
          <h3 id="task-subtasks-heading" className="mb-2 text-sm font-semibold">
            Subtasks
            {task.subtasks.total > 0 &&
              ` (${task.subtasks.completed}/${task.subtasks.total})`}
          </h3>
          <SubtaskList parentId={task.id} className="" />
        </section>
      )}
    </div>
  );
}

/** Side panel to view and edit one task. `taskId = null` keeps it closed. */
export function TaskPanel({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const task = useTask(taskId);

  return (
    <Sheet open={taskId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{task.data?.parent ? 'Subtask' : 'Task'}</SheetTitle>
          <SheetDescription>
            {task.data?.parent
              ? `Part of "${task.data.parent.title}"`
              : 'Edit the details, or tick it off from the list.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {task.isPending ? (
            <Skeleton className="h-80 w-full" />
          ) : task.isError ? (
            <FormErrorAlert error={task.error} />
          ) : (
            // key: start fresh whenever the saved task changes
            <TaskEditor
              key={task.data.updatedAt}
              task={task.data}
              onDone={onClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
