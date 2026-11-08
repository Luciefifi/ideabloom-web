'use client';

import {
  CircleCheckBigIcon,
  ListChecksIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { PRIORITY_LABELS } from '@/features/ideas/idea-styles';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TASK_FILTERS,
  hasActiveTaskFilters,
  taskFiltersFromParams,
  taskFiltersToParams,
  type TaskFilters,
} from '../filters';
import { TASK_VIEW_LABELS } from '../task-styles';
import { TASK_PRIORITIES, TASK_VIEWS, type TaskView } from '../types';
import { useProjectOptions } from '../use-project-options';
import { TaskList } from './task-list';
import { TaskPanel } from './task-panel';
import { TaskQuickAdd } from './task-quick-add';

const EMPTY_VIEW: Record<TaskView, { title: string; description: string }> = {
  pending: {
    title: 'Nothing to do',
    description:
      'Add a task above. Give it a due date to see it in the right order.',
  },
  overdue: {
    title: 'Nothing overdue',
    description: "You're on top of things.",
  },
  completed: {
    title: 'No completed tasks yet',
    description: 'Tick a task off and it will show up here.',
  },
  all: { title: 'No tasks yet', description: 'Add your first task above.' },
};

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-auto"
    >
      {children}
    </NativeSelect>
  );
}

export function TasksView() {
  const { filters, setFilters, updateFilter } = useUrlFilters({
    fromParams: taskFiltersFromParams,
    toParams: taskFiltersToParams,
    defaults: DEFAULT_TASK_FILTERS,
  });
  const projects = useProjectOptions();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const filtered = hasActiveTaskFilters(filters);

  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.search) updateFilter('search', value);
  });
  useEffect(() => {
    applySearch(debouncedSearch);
  }, [debouncedSearch]);

  const set =
    <K extends keyof TaskFilters>(key: K) =>
    (value: string) =>
      updateFilter(key, value as TaskFilters[K]);

  // Clearing keeps the chosen tab (Pending, Overdue…).
  const clear = () => {
    setSearchText('');
    setFilters({ ...DEFAULT_TASK_FILTERS, view: filters.view });
  };

  return (
    <div className="space-y-6">
      <TaskQuickAdd />

      <div
        role="group"
        aria-label="Which tasks"
        className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1"
      >
        {TASK_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={filters.view === view}
            onClick={() => updateFilter('view', view)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              filters.view === view && 'bg-card text-foreground shadow-xs',
            )}
          >
            {TASK_VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      <div className="space-y-3" role="search" aria-label="Filter tasks">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search tasks"
            placeholder="Search task titles…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            label="Project"
            value={filters.projectId}
            onChange={set('projectId')}
          >
            <NativeSelectOption value="">All projects</NativeSelectOption>
            <NativeSelectOption value="none">No project</NativeSelectOption>
            {(projects.data ?? []).map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.title}
              </NativeSelectOption>
            ))}
          </Select>
          <Select
            label="Priority"
            value={filters.priority}
            onChange={set('priority')}
          >
            <NativeSelectOption value="">Any priority</NativeSelectOption>
            {[...TASK_PRIORITIES].reverse().map((p) => (
              <NativeSelectOption key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value="none">No priority</NativeSelectOption>
          </Select>
          <Select label="Sort by" value={filters.sort} onChange={set('sort')}>
            <NativeSelectOption value="">
              {filters.view === 'completed'
                ? 'Recently completed'
                : 'Due date (soonest)'}
            </NativeSelectOption>
            <NativeSelectOption value="priority">
              Highest priority
            </NativeSelectOption>
            <NativeSelectOption value="createdAt">
              Newest first
            </NativeSelectOption>
            <NativeSelectOption value="updatedAt">
              Recently updated
            </NativeSelectOption>
            <NativeSelectOption value="title">Title A–Z</NativeSelectOption>
          </Select>
          {filtered && (
            <Button variant="ghost" onClick={clear}>
              <XIcon aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <TaskList
        filters={filters}
        onOpen={setOpenTaskId}
        label={`${TASK_VIEW_LABELS[filters.view]} tasks`}
        empty={
          filtered ? (
            <EmptyState
              icon={SearchXIcon}
              title="No tasks match these filters"
              description="Try another search, or clear the filters."
              action={
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={
                filters.view === 'overdue' ? CircleCheckBigIcon : ListChecksIcon
              }
              title={EMPTY_VIEW[filters.view].title}
              description={EMPTY_VIEW[filters.view].description}
            />
          )
        }
      />

      <TaskPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}
