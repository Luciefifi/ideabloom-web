import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TasksView } from '@/features/tasks/components/tasks-view';

export const metadata: Metadata = { title: 'Tasks' };

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything you need to do, across all your projects."
      />
      {/* TasksView reads its filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <TasksView />
      </Suspense>
    </>
  );
}
