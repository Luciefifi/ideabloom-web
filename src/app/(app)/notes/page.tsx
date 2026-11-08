import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { NewNoteButton } from '@/features/notes/components/new-note-button';
import { NotesView } from '@/features/notes/components/notes-view';

export const metadata: Metadata = { title: 'Notes' };

export default function NotesPage() {
  return (
    <>
      <PageHeader
        title="Notes"
        description="Write down thoughts, plans and research."
        actions={<NewNoteButton />}
      />
      {/* NotesView reads its filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <NotesView />
      </Suspense>
    </>
  );
}
