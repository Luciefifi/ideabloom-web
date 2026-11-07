import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="Find anything across ideas, projects, tasks, notes and resources."
      />
      <EmptyState
        icon={Search}
        title="Search is on its way"
        description="One search box for everything in your workspace. (Milestone 7)"
      />
    </>
  );
}
