import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteDetailView } from '@/features/notes/components/note-detail-view';

export const metadata: Metadata = { title: 'Note' };

/** /notes/<id>. The id is read in the client component (useParams) inside Suspense. */
export default function NotePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <NoteDetailView />
    </Suspense>
  );
}
