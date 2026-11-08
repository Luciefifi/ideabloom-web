'use client';

import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import type { TaskFilters } from '../filters';
import { useTasks } from '../use-tasks';
import { TaskRow } from './task-row';

/**
 * Loads and shows tasks for some filters, with loading / error / "load more".
 * `empty` is shown when there are no tasks.
 */
export function TaskList({
  filters,
  onOpen,
  empty,
  hideProject,
  label,
}: {
  filters: TaskFilters;
  onOpen: (id: string) => void;
  empty: React.ReactNode;
  hideProject?: boolean;
  label: string;
}) {
  const query = useTasks(filters);
  const tasks = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="space-y-3">
        <FormErrorAlert error={query.error} />
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (tasks.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-3">
      <ul aria-label={label} className="divide-y">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow task={task} onOpen={onOpen} hideProject={hideProject} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {tasks.length} of {total} task{total === 1 ? '' : 's'}
      </p>
      {query.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage && <Spinner aria-hidden="true" />}
          Load more
        </Button>
      )}
    </div>
  );
}
