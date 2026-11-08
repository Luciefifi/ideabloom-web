import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IdeaDetailView } from '@/features/ideas/components/idea-detail-view';

export const metadata: Metadata = { title: 'Idea' };

/**
 * /ideas/<id>. The id is read in the client component (useParams) inside
 * Suspense, as Cache Components requires for dynamic route params.
 */
export default function IdeaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <IdeaDetailView />
    </Suspense>
  );
}
