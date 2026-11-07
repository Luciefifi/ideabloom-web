import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Deadlines, milestones and due dates at a glance."
      />
      <EmptyState
        icon={CalendarDays}
        title="Nothing scheduled yet"
        description="Task due dates, milestones and project deadlines will appear on your calendar. (Milestone 7)"
      />
    </>
  );
}
