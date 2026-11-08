'use client';

import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { useProjectOptions } from '../use-project-options';
import { useCreateTask } from '../use-tasks';

/**
 * Type a task, optionally a due date (and project), press Enter.
 * On a project page, `projectId` is fixed and the project picker is hidden.
 */
export function TaskQuickAdd({ projectId }: { projectId?: string }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [chosenProject, setChosenProject] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateTask();
  const projects = useProjectOptions({ enabled: !projectId });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || create.isPending) return;
    create.mutate(
      {
        title: title.trim(),
        dueDate: dueDate || null,
        projectId: projectId ?? (chosenProject || null),
      },
      {
        onSuccess: (task) => {
          setTitle('');
          setDueDate('');
          toast.success(`Added "${task.title}"`);
          inputRef.current?.focus();
        },
        onError: (e) =>
          toast.error(`Couldn't add the task. ${errorMessage(e)}`),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-xs focus-within:border-lavender sm:flex-row sm:items-center"
    >
      <label htmlFor="task-quick-add" className="sr-only">
        New task
      </label>
      <Input
        ref={inputRef}
        id="task-quick-add"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="Add a task… (press Enter)"
        autoComplete="off"
        className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <div className="flex gap-2">
        <label htmlFor="task-quick-due" className="sr-only">
          Task due date (optional)
        </label>
        <input
          id="task-quick-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
        />
        {!projectId && (
          <NativeSelect
            aria-label="Task project (optional)"
            value={chosenProject}
            onChange={(e) => setChosenProject(e.target.value)}
            className="w-36"
          >
            <NativeSelectOption value="">No project</NativeSelectOption>
            {(projects.data ?? []).map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <Button type="submit" disabled={!title.trim() || create.isPending}>
          {create.isPending ? (
            <Spinner aria-hidden="true" />
          ) : (
            <PlusIcon aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">Add task</span>
        </Button>
      </div>
    </form>
  );
}
