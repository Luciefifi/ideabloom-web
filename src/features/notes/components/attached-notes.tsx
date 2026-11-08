'use client';

import { FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Attachment } from '@/features/library/types';
import { DEFAULT_NOTE_FILTERS } from '../filters';
import { editedAgo } from '../note-styles';
import { useNotes } from '../use-notes';
import { NewNoteButton } from './new-note-button';

const SHOWN = 10;

/** The Notes section of an idea or project page. */
export function AttachedNotes({ attachTo }: { attachTo: Partial<Attachment> }) {
  const query = useNotes(
    {
      ...DEFAULT_NOTE_FILTERS,
      ideaId: attachTo.ideaId ?? undefined,
      projectId: attachTo.projectId ?? undefined,
    },
    SHOWN,
  );
  const notes = query.data?.pages[0]?.data ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="space-y-3">
      {query.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : query.isError ? (
        <FormErrorAlert error={query.error} />
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul aria-label="Attached notes" className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <FileTextIcon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {note.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {editedAgo(note.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {total > SHOWN && (
        <p className="text-xs text-muted-foreground">
          Showing the {SHOWN} most recent of {total}.
        </p>
      )}
      <NewNoteButton attachTo={attachTo} variant="outline" />
    </div>
  );
}
