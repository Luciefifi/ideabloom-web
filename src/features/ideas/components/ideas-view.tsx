'use client';

import { LightbulbIcon, SearchXIcon } from 'lucide-react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { hasActiveFilters } from '../filters';
import { useIdeaFilters } from '../use-idea-filters';
import { useIdeas } from '../use-ideas';
import { IdeaCard } from './idea-card';
import { IdeaFiltersBar } from './idea-filters-bar';
import { QuickCapture } from './quick-capture';

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading ideas">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function IdeasView() {
  const { filters, updateFilter, clearFilters } = useIdeaFilters();
  const ideasQuery = useIdeas(filters);
  const ideas = ideasQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const total = ideasQuery.data?.pages[0]?.meta.total ?? 0;
  const filtered = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <QuickCapture />

      <IdeaFiltersBar
        filters={filters}
        onChange={updateFilter}
        onClear={clearFilters}
      />

      {ideasQuery.isPending ? (
        <ListSkeleton />
      ) : ideasQuery.isError ? (
        <div className="space-y-3">
          <FormErrorAlert error={ideasQuery.error} />
          <Button variant="outline" onClick={() => void ideasQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : ideas.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={SearchXIcon}
            title="No ideas match these filters"
            description="Try a different search or fewer filters."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={LightbulbIcon}
            title="No ideas yet"
            description="Type your first idea in the box above and press Enter. You can add details later."
          />
        )
      ) : (
        <section aria-label="Ideas" className="space-y-3">
          <p
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {total} {total === 1 ? 'idea' : 'ideas'}
            {filtered && ' found'}
          </p>
          {/* While new filter results load, the previous list stays visible but faded. */}
          <ul
            className={cn(
              'space-y-3 transition-opacity',
              ideasQuery.isPlaceholderData && 'opacity-60',
            )}
          >
            {ideas.map((idea) => (
              <li key={idea.id}>
                <IdeaCard idea={idea} />
              </li>
            ))}
          </ul>

          {ideasQuery.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void ideasQuery.fetchNextPage()}
                disabled={ideasQuery.isFetchingNextPage}
              >
                {ideasQuery.isFetchingNextPage && (
                  <Spinner aria-hidden="true" />
                )}
                {ideasQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
