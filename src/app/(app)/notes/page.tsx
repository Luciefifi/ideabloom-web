import type { Metadata } from 'next';
import { NotebookPen } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Notes' };

export default function NotesPage() {
  return (
    <>
      <PageHeader
        title="Notes"
        description="Write down thoughts, plans and research."
      />
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Rich-text notes you can link to ideas and projects. (Milestone 5)"
      />
    </>
  );
}
