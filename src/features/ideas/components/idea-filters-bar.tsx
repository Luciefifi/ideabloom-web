'use client';

import { SearchIcon, StarIcon, XIcon } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';
import { hasActiveFilters, type IdeaFilters } from '../filters';
import { PRIORITY_LABELS, STATUS_LABELS } from '../idea-styles';
import { IDEA_PRIORITIES, IDEA_STATUSES } from '../types';
import { useCategories, useTags } from '../use-ideas';

interface IdeaFiltersBarProps {
  filters: IdeaFilters;
  onChange: <K extends keyof IdeaFilters>(
    key: K,
    value: IdeaFilters[K],
  ) => void;
  onClear: () => void;
}

/** Small labelled select used for each filter. */
function FilterSelect({
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
      onChange={(event) => onChange(event.target.value)}
      className="w-full sm:w-auto"
    >
      {children}
    </NativeSelect>
  );
}

export function IdeaFiltersBar({
  filters,
  onChange,
  onClear,
}: IdeaFiltersBarProps) {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  // The search box has its own state so typing feels instant; the URL (and
  // the API call) follows once typing pauses.
  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  // useEffectEvent reads the latest filters without re-running the effect,
  // so only a change of the debounced text triggers a search.
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.search) onChange('search', value);
  });
  useEffect(() => {
    applySearch(debouncedSearch);
  }, [debouncedSearch]);

  const clear = () => {
    setSearchText('');
    onClear();
  };

  return (
    <div className="space-y-3" role="search" aria-label="Filter ideas">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search ideas"
          placeholder="Search titles and descriptions…"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="h-9 bg-card pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(value) =>
            onChange('status', value as IdeaFilters['status'])
          }
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {IDEA_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(value) =>
            onChange('priority', value as IdeaFilters['priority'])
          }
        >
          <NativeSelectOption value="">Any priority</NativeSelectOption>
          {[...IDEA_PRIORITIES].reverse().map((priority) => (
            <NativeSelectOption key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value="none">No priority</NativeSelectOption>
        </FilterSelect>

        <FilterSelect
          label="Category"
          value={filters.categoryId}
          onChange={(value) => onChange('categoryId', value)}
        >
          <NativeSelectOption value="">All categories</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value="none">Uncategorized</NativeSelectOption>
        </FilterSelect>

        <FilterSelect
          label="Tag"
          value={filters.tagId}
          onChange={(value) => onChange('tagId', value)}
        >
          <NativeSelectOption value="">All tags</NativeSelectOption>
          {tags.map((tag) => (
            <NativeSelectOption key={tag.id} value={tag.id}>
              #{tag.name}
            </NativeSelectOption>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Archived"
          value={filters.archived}
          onChange={(value) =>
            onChange('archived', value as IdeaFilters['archived'])
          }
        >
          <NativeSelectOption value="false">Active</NativeSelectOption>
          <NativeSelectOption value="true">Archived</NativeSelectOption>
          <NativeSelectOption value="all">Active & archived</NativeSelectOption>
        </FilterSelect>

        <FilterSelect
          label="Sort by"
          value={filters.sort}
          onChange={(value) => onChange('sort', value as IdeaFilters['sort'])}
        >
          <NativeSelectOption value="">
            {filters.search ? 'Best match' : 'Recently updated'}
          </NativeSelectOption>
          {filters.search && (
            <NativeSelectOption value="updatedAt">
              Recently updated
            </NativeSelectOption>
          )}
          <NativeSelectOption value="createdAt">
            Newest first
          </NativeSelectOption>
          <NativeSelectOption value="title">Title A–Z</NativeSelectOption>
          <NativeSelectOption value="priority">
            Highest priority
          </NativeSelectOption>
        </FilterSelect>

        <Button
          type="button"
          variant="outline"
          aria-pressed={filters.favorite}
          onClick={() => onChange('favorite', !filters.favorite)}
          className={cn(filters.favorite && 'border-amber-300 bg-amber-50')}
        >
          <StarIcon
            className={cn(filters.favorite && 'fill-amber-400 text-amber-500')}
            aria-hidden="true"
          />
          Favourites
        </Button>

        {hasActiveFilters(filters) && (
          <Button type="button" variant="ghost" onClick={clear}>
            <XIcon aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
