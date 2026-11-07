import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Turn ideas into projects with goals, milestones and progress."
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create projects or convert an idea into one, then track milestones and progress. (Milestone 3)"
      />
    </>
  );
}
