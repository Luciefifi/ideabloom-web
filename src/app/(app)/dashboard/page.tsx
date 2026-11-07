import type { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of everything you are working on."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Your dashboard will come alive"
        description="Once you add ideas, projects and tasks, you will see totals, deadlines, progress and recent activity here. (Milestone 6)"
      />
    </>
  );
}
