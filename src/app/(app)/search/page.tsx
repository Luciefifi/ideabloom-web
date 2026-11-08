import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchView } from '@/features/search/components/search-view';

export const metadata: Metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="Find anything across your ideas, projects, tasks, notes and resources."
      />
      {/* SearchView reads the query from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <SearchView />
      </Suspense>
    </>
  );
}
