'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Attachment } from '@/features/library/types';
import { useCreateNote } from '../use-notes';

/** Creates an empty note (optionally attached) and opens it in the editor. */
export function NewNoteButton({
  attachTo,
  variant = 'default',
}: {
  attachTo?: Partial<Attachment>;
  variant?: 'default' | 'outline';
}) {
  const router = useRouter();
  const create = useCreateNote();

  return (
    <Button
      variant={variant}
      size={variant === 'outline' ? 'sm' : 'default'}
      disabled={create.isPending}
      onClick={() =>
        create.mutate(attachTo ?? {}, {
          onSuccess: (note) => router.push(`/notes/${note.id}`),
          onError: (e) =>
            toast.error(`Couldn't create the note. ${errorMessage(e)}`),
        })
      }
    >
      {create.isPending ? (
        <Spinner aria-hidden="true" />
      ) : (
        <PlusIcon aria-hidden="true" />
      )}
      New note
    </Button>
  );
}
