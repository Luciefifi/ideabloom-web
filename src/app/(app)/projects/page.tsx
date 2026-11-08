import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { NewProjectSheet } from '@/features/projects/components/new-project-sheet';
import { ProjectsView } from '@/features/projects/components/projects-view';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Turn ideas into projects with goals, milestones and progress."
        actions={<NewProjectSheet />}
      />
      {/* ProjectsView reads its filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <ProjectsView />
      </Suspense>
    </>
  );
}
