'use client';

import { useState } from 'react';
import { DEFAULT_TASK_FILTERS, type TaskFilters } from '../filters';
import { TaskList } from './task-list';
import { TaskPanel } from './task-panel';
import { TaskQuickAdd } from './task-quick-add';

/** The Tasks section of a project page: add, tick off, open, show completed. */
export function ProjectTasks({ projectId }: { projectId: string }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const filters: TaskFilters = {
    ...DEFAULT_TASK_FILTERS,
    view: showCompleted ? 'all' : 'pending',
    projectId,
  };

  return (
    <div className="space-y-4">
      <TaskQuickAdd projectId={projectId} />
      <TaskList
        filters={filters}
        onOpen={setOpenTaskId}
        hideProject
        label="Project tasks"
        empty={
          <p className="text-sm text-muted-foreground">
            {showCompleted
              ? 'No tasks yet. Once you add tasks, progress is based on them.'
              : 'No open tasks. Add one above, or show completed tasks.'}
          </p>
        }
      />
      <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={(e) => setShowCompleted(e.target.checked)}
          className="size-4 accent-[var(--lavender-deep)]"
        />
        Show completed tasks
      </label>
      <TaskPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}
