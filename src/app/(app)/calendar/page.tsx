import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarView } from '@/features/calendar/components/calendar-view';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Task due dates, milestones and project deadlines, month by month."
      />
      {/* CalendarView reads the month from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-xl" />}>
        <CalendarView />
      </Suspense>
    </>
  );
}
