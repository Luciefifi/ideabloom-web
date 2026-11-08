import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDetailView } from '@/features/projects/components/project-detail-view';

export const metadata: Metadata = { title: 'Project' };

/** /projects/<id>. The id is read with useParams inside Suspense (Cache Components). */
export default function ProjectPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ProjectDetailView />
    </Suspense>
  );
}
