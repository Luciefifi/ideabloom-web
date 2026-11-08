'use client';

import {
  LibraryIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react';
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
import { useCategories, useTags } from '@/features/ideas/use-ideas';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  DEFAULT_RESOURCE_FILTERS,
  hasActiveResourceFilters,
  resourceFiltersFromParams,
  resourceFiltersToParams,
  type ResourceFilters,
} from '../filters';
import { RESOURCE_TYPE_LABELS } from '../resource-styles';
import { RESOURCE_TYPES, type Resource } from '../types';
import { useResources } from '../use-resources';
import { ResourceRow } from './resource-row';
import { ResourceSheet } from './resource-sheet';

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

export function ResourcesView() {
  const { filters, updateFilter, clearFilters } = useUrlFilters({
    fromParams: resourceFiltersFromParams,
    toParams: resourceFiltersToParams,
    defaults: DEFAULT_RESOURCE_FILTERS,
  });
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const query = useResources(filters);
  const resources = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const filtered = hasActiveResourceFilters(filters);
  // undefined = closed, null = adding a new one
  const [editing, setEditing] = useState<Resource | null | undefined>();

  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.search) updateFilter('search', value);
  });
  useEffect(() => {
    applySearch(debouncedSearch);
  }, [debouncedSearch]);

  const set =
    <K extends keyof ResourceFilters>(key: K) =>
    (value: string) =>
      updateFilter(key, value as ResourceFilters[K]);
  const clear = () => {
    setSearchText('');
    clearFilters();
  };
  const addButton = (
    <Button onClick={() => setEditing(null)}>
      <PlusIcon aria-hidden="true" />
      Add resource
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{addButton}</div>
      <div className="space-y-3" role="search" aria-label="Filter resources">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search resources"
            placeholder="Search titles, descriptions and your notes…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select label="Type" value={filters.type} onChange={set('type')}>
            <NativeSelectOption value="">All types</NativeSelectOption>
            {RESOURCE_TYPES.map((t) => (
              <NativeSelectOption key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </NativeSelectOption>
            ))}
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
          <Select label="Tag" value={filters.tagId} onChange={set('tagId')}>
            <NativeSelectOption value="">All tags</NativeSelectOption>
            {tags.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name}
              </NativeSelectOption>
            ))}
          </Select>
          <Select label="Sort by" value={filters.sort} onChange={set('sort')}>
            <NativeSelectOption value="">Recently updated</NativeSelectOption>
            <NativeSelectOption value="createdAt">
              Newest first
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

      {query.isPending ? (
        <div
          className="space-y-2"
          aria-busy="true"
          aria-label="Loading resources"
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="space-y-3">
          <FormErrorAlert error={query.error} />
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : resources.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="No resources match these filters"
            description="Try another search, or clear the filters."
            action={
              <Button variant="outline" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={LibraryIcon}
            title="No resources yet"
            description="Save articles, videos and documents you want to come back to."
            action={addButton}
          />
        )
      ) : (
        <div className="space-y-3">
          <ul
            aria-label="Resources"
            className="divide-y rounded-xl border bg-card p-2"
          >
            {resources.map((resource) => (
              <li key={resource.id}>
                <ResourceRow resource={resource} onEdit={setEditing} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {resources.length} of {total} resource
            {total === 1 ? '' : 's'}
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
      )}

      <ResourceSheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        resource={editing ?? null}
      />
    </div>
  );
}
