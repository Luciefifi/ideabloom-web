'use client';

import { FolderKanbanIcon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { PRIORITY_LABELS } from '@/features/ideas/idea-styles';
import { useCategories } from '@/features/ideas/use-ideas';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PROJECT_FILTERS,
  hasActiveProjectFilters,
  projectFiltersFromParams,
  projectFiltersToParams,
  type ProjectFilters,
} from '../filters';
import { PROJECT_STATUS_LABELS } from '../project-styles';
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from '../types';
import { useProjects } from '../use-projects';
import { ProjectCard } from './project-card';

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

export function ProjectsView() {
  const { filters, updateFilter, clearFilters } = useUrlFilters({
    fromParams: projectFiltersFromParams,
    toParams: projectFiltersToParams,
    defaults: DEFAULT_PROJECT_FILTERS,
  });
  const { data: categories = [] } = useCategories();
  const query = useProjects(filters);
  const projects = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const filtered = hasActiveProjectFilters(filters);

  // Debounced search, same approach as the Ideas page.
  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.search) updateFilter('search', value);
  });
  useEffect(() => {
    applySearch(debouncedSearch);
  }, [debouncedSearch]);

  const set =
    <K extends keyof ProjectFilters>(key: K) =>
    (value: string) =>
      updateFilter(key, value as ProjectFilters[K]);

  return (
    <div className="space-y-6">
      <div className="space-y-3" role="search" aria-label="Filter projects">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search projects"
            placeholder="Search project titles…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            label="Status"
            value={filters.status}
            onChange={set('status')}
          >
            <NativeSelectOption value="">Active projects</NativeSelectOption>
            <NativeSelectOption value="all">All projects</NativeSelectOption>
            {PROJECT_STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </NativeSelectOption>
            ))}
          </Select>
          <Select
            label="Priority"
            value={filters.priority}
            onChange={set('priority')}
          >
            <NativeSelectOption value="">Any priority</NativeSelectOption>
            {[...PROJECT_PRIORITIES].reverse().map((p) => (
              <NativeSelectOption key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value="none">No priority</NativeSelectOption>
          </Select>
          <Select
            label="Category"
            value={filters.categoryId}
            onChange={set('categoryId')}
          >
            <NativeSelectOption value="">All categories</NativeSelectOption>
            {categories.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value="none">Uncategorized</NativeSelectOption>
          </Select>
          <Select label="Sort by" value={filters.sort} onChange={set('sort')}>
            <NativeSelectOption value="">Recently updated</NativeSelectOption>
            <NativeSelectOption value="targetDate">
              Target date (soonest)
            </NativeSelectOption>
            <NativeSelectOption value="progress">
              Most progress
            </NativeSelectOption>
            <NativeSelectOption value="title">Title A–Z</NativeSelectOption>
            <NativeSelectOption value="createdAt">
              Newest first
            </NativeSelectOption>
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchText('');
                clearFilters();
              }}
            >
              <XIcon aria-hidden="true" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {query.isPending ? (
        <div
          className="grid gap-3 sm:grid-cols-2"
          aria-busy="true"
          aria-label="Loading projects"
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="space-y-3">
          <FormErrorAlert error={query.error} />
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : projects.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="No projects match these filters"
            description="Try another search, or show all projects."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  clearFilters();
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FolderKanbanIcon}
            title="No active projects"
            description="Create a project, or open an idea and choose “Convert to project”."
          />
        )
      ) : (
        <section aria-label="Projects" className="space-y-3">
          <p
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {total} {total === 1 ? 'project' : 'projects'}
          </p>
          <ul
            className={cn(
              'grid gap-3 transition-opacity sm:grid-cols-2',
              query.isPlaceholderData && 'opacity-60',
            )}
          >
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage && <Spinner aria-hidden="true" />}
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
