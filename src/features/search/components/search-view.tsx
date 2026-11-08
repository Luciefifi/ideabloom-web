'use client';

import { format } from 'date-fns';
import {
  ArchiveIcon,
  ExternalLinkIcon,
  FolderIcon,
  PinIcon,
  SearchIcon,
  SearchXIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useEffectEvent, useState } from 'react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { cn } from '@/lib/utils';
import { Highlighted } from '../highlight';
import {
  resultHref,
  SEARCH_TYPE_ICONS,
  SEARCH_TYPE_LABELS,
} from '../search-styles';
import { SEARCH_TYPES, type SearchResult, type SearchType } from '../types';
import { useSearch } from '../use-search';

interface SearchPageFilters {
  q: string;
  type: SearchType | '';
  archived: '' | 'true';
}

const DEFAULTS: SearchPageFilters = { q: '', type: '', archived: '' };

function fromParams(params: URLSearchParams): SearchPageFilters {
  const type = params.get('type') ?? '';
  return {
    q: params.get('q') ?? '',
    type: (SEARCH_TYPES as readonly string[]).includes(type)
      ? (type as SearchType)
      : '',
    archived: params.get('archived') === 'true' ? 'true' : '',
  };
}

function toParams(filters: SearchPageFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

function ResultRow({ result }: { result: SearchResult }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
      <div className="min-w-0 flex-1 space-y-0.5">
        <Link
          href={resultHref(result)}
          className="block text-sm font-medium break-words hover:underline"
        >
          <Highlighted text={result.title} />
        </Link>
        {result.snippet && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            <Highlighted text={result.snippet} />
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {result.status && (
            <span className="capitalize">
              {result.status.replaceAll('_', ' ')}
            </span>
          )}
          {result.archived && (
            <span className="inline-flex items-center gap-1">
              <ArchiveIcon className="size-3" aria-hidden="true" />
              Archived
            </span>
          )}
          {result.pinned && (
            <span className="inline-flex items-center gap-1">
              <PinIcon className="size-3" aria-hidden="true" />
              Pinned
            </span>
          )}
          {result.project && (
            <span className="inline-flex items-center gap-1">
              <FolderIcon className="size-3" aria-hidden="true" />
              {result.project.title}
            </span>
          )}
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Open link
              <ExternalLinkIcon className="size-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <span>
            Updated {format(new Date(result.updatedAt), 'd MMM yyyy')}
          </span>
        </p>
      </div>
    </div>
  );
}

export function SearchView() {
  const { filters, updateFilter, setFilters } = useUrlFilters({
    fromParams,
    toParams,
    defaults: DEFAULTS,
  });
  const [text, setText] = useState(filters.q);
  const debounced = useDebouncedValue(text.trim(), 300);
  const applySearch = useEffectEvent((value: string) => {
    if (value !== filters.q) updateFilter('q', value);
  });
  useEffect(() => {
    applySearch(debounced);
  }, [debounced]);

  const search = useSearch(filters.q, {
    types: filters.type ? [filters.type] : undefined,
    limit: filters.type ? 20 : 5,
    includeArchived: filters.archived === 'true',
  });
  const groups = search.data?.groups ?? [];
  const total = groups.reduce((sum, g) => sum + g.total, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3" role="search">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            autoFocus
            aria-label="Search everything"
            placeholder="Search ideas, projects, tasks, notes and resources…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Show"
            className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1"
          >
            {(['', ...SEARCH_TYPES] as const).map((type) => (
              <button
                key={type || 'all'}
                type="button"
                aria-pressed={filters.type === type}
                onClick={() => updateFilter('type', type)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground',
                  filters.type === type && 'bg-card text-foreground shadow-xs',
                )}
              >
                {type ? SEARCH_TYPE_LABELS[type] : 'All'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.archived === 'true'}
              onChange={(e) =>
                updateFilter('archived', e.target.checked ? 'true' : '')
              }
              className="size-4 accent-[var(--lavender-deep)]"
            />
            Include archived ideas
          </label>
        </div>
      </div>

      {!filters.q ? (
        <EmptyState
          icon={SearchIcon}
          title="Search everything"
          description="Ideas, projects, tasks, notes and resources. Partial words work: “gard” finds “garden”. Tip: press Ctrl + K anywhere."
        />
      ) : search.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Searching">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : search.isError ? (
        <div className="space-y-3">
          <FormErrorAlert error={search.error} />
          <Button variant="outline" onClick={() => void search.refetch()}>
            Try again
          </Button>
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title={`Nothing found for “${filters.q}”`}
          description="Check the spelling, try fewer words, or include archived ideas."
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total} result{total === 1 ? '' : 's'} for “{filters.q}”
          </p>
          {groups
            .filter((g) => g.total > 0)
            .map((group) => {
              const Icon = SEARCH_TYPE_ICONS[group.type];
              return (
                <section
                  key={group.type}
                  aria-labelledby={`results-${group.type}`}
                  className="rounded-xl border bg-card p-4"
                >
                  <h2
                    id={`results-${group.type}`}
                    className="mb-2 flex items-center gap-2 text-base font-semibold"
                  >
                    <Icon
                      className="size-4 text-lavender-deep"
                      aria-hidden="true"
                    />
                    {SEARCH_TYPE_LABELS[group.type]}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({group.total})
                    </span>
                  </h2>
                  <ul className="divide-y">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <ResultRow result={item} />
                      </li>
                    ))}
                  </ul>
                  {group.total > group.items.length &&
                    (filters.type ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Showing the {group.items.length} best matches. Add a
                        word to narrow it down.
                      </p>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          setFilters({ ...filters, type: group.type })
                        }
                      >
                        Show more {SEARCH_TYPE_LABELS[group.type].toLowerCase()}
                      </Button>
                    ))}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
