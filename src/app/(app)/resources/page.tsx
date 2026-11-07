import type { Metadata } from 'next';
import { Library } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Resources' };

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Links, articles, videos and documents worth keeping."
      />
      <EmptyState
        icon={Library}
        title="No resources yet"
        description="Save what you discover while learning and connect it to your ideas and projects. (Milestone 5)"
      />
    </>
  );
}
