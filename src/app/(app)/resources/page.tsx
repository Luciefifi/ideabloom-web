import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ResourcesView } from '@/features/resources/components/resources-view';

export const metadata: Metadata = { title: 'Resources' };

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Articles, videos and documents worth keeping, with your own notes."
      />
      {/* ResourcesView reads its filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <ResourcesView />
      </Suspense>
    </>
  );
}
