import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { IdeasView } from '@/features/ideas/components/ideas-view';

export const metadata: Metadata = { title: 'Ideas' };

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        title="Ideas"
        description="Capture ideas quickly and explore them when you're ready."
      />
      {/* IdeasView reads the filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <IdeasView />
      </Suspense>
    </>
  );
}
