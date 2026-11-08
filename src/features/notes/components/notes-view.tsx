'use client';

import { NotebookPenIcon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
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
  DEFAULT_NOTE_FILTERS,
  hasActiveNoteFilters,
  noteFiltersFromParams,
  noteFiltersToParams,
  type NoteFilters,
} from '../filters';
import { useNotes } from '../use-notes';
import { NewNoteButton } from './new-note-button';
import { NoteCard } from './note-card';

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

export function NotesView() {
  const { filters, updateFilter, clearFilters } = useUrlFilters({
    fromParams: noteFiltersFromParams,
    toParams: noteFiltersToParams,
    defaults: DEFAULT_NOTE_FILTERS,
  });
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const query = useNotes(filters);
  const notes = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const filtered = hasActiveNoteFilters(filters);

  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.search) updateFilter('search', value);
  });
  useEffect(() => {
    applySearch(debouncedSearch);
  }, [debouncedSearch]);

  const set =
    <K extends keyof NoteFilters>(key: K) =>
    (value: string) =>
      updateFilter(key, value as NoteFilters[K]);
  const clear = () => {
    setSearchText('');
    clearFilters();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3" role="search" aria-label="Filter notes">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search notes"
            placeholder="Search titles and text…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
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
          <Select label="Show" value={filters.pinned} onChange={set('pinned')}>
            <NativeSelectOption value="">All notes</NativeSelectOption>
            <NativeSelectOption value="true">Pinned only</NativeSelectOption>
          </Select>
          <Select label="Sort by" value={filters.sort} onChange={set('sort')}>
            <NativeSelectOption value="">Recently edited</NativeSelectOption>
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
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading notes"
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="space-y-3">
          <FormErrorAlert error={query.error} />
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : notes.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="No notes match these filters"
            description="Try another search, or clear the filters."
            action={
              <Button variant="outline" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={NotebookPenIcon}
            title="No notes yet"
            description="Write down plans, research and thoughts. Notes save automatically."
            action={<NewNoteButton />}
          />
        )
      ) : (
        <div className="space-y-4">
          <ul
            aria-label="Notes"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {notes.map((note) => (
              <li key={note.id} className="flex">
                <div className="w-full">
                  <NoteCard note={note} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {notes.length} of {total} note{total === 1 ? '' : 's'}
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
    </div>
  );
}
