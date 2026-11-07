import type { Metadata } from 'next';
import { ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Tasks' };

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything you need to do, across all your projects."
      />
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Tasks with subtasks, priorities, due dates and overdue tracking. (Milestone 4)"
      />
    </>
  );
}
