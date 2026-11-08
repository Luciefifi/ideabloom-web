'use client';

import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  PinIcon,
  PinOffIcon,
  SearchXIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDelete } from '@/features/ideas/components/confirm-delete';
import { TagInput } from '@/features/ideas/components/tag-input';
import { useCategories, useTags } from '@/features/ideas/use-ideas';
import { AttachSelect } from '@/features/library/attach-select';
import { attachmentOf } from '@/features/library/types';
import { useAutosave, type AutosaveStatus } from '@/hooks/use-autosave';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { DEFAULT_NOTE_TITLE } from '../note-styles';
import type { Note, NoteInput } from '../types';
import { useDeleteNote, useNote, useUpdateNote } from '../use-notes';
import { NoteEditor } from './note-editor';

function BackLink() {
  return (
    <Link
      href="/notes"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
    >
      <ArrowLeftIcon aria-hidden="true" />
      All notes
    </Link>
  );
}

function SaveStatus({
  status,
  onRetry,
}: {
  status: AutosaveStatus;
  onRetry: () => void;
}) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      {status === 'saving' && (
        <>
          <Spinner className="size-3" aria-hidden="true" /> Saving…
        </>
      )}
      {status === 'unsaved' && 'Unsaved changes'}
      {status === 'saved' && (
        <>
          <CheckIcon className="size-3" aria-hidden="true" /> Saved
        </>
      )}
      {status === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-destructive">
          <AlertCircleIcon className="size-3" aria-hidden="true" />
          Couldn&apos;t save.
          <button
            type="button"
            onClick={onRetry}
            className="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </span>
      )}
    </span>
  );
}

/** Pin, attach, category and tags: saved as soon as they change. */
function OrganisePanel({ note }: { note: Note }) {
  const update = useUpdateNote(note.id);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const [tagNames, setTagNames] = useState(note.tags.map((t) => t.name));

  const save = (input: NoteInput, done?: string) =>
    update.mutate(input, {
      onSuccess: () => done && toast.success(done),
      onError: (e) => toast.error(`Couldn't save. ${errorMessage(e)}`),
    });

  return (
    <aside
      aria-label="Organise this note"
      className="space-y-4 rounded-xl border bg-card p-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="note-attach" className="text-sm font-medium">
          Attached to
        </label>
        <AttachSelect
          id="note-attach"
          value={attachmentOf(note)}
          current={note}
          disabled={update.isPending}
          onChange={(attachment) => save(attachment)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="note-category" className="text-sm font-medium">
          Category
        </label>
        <NativeSelect
          id="note-category"
          className="w-full"
          value={note.category?.id ?? ''}
          disabled={update.isPending}
          onChange={(e) => save({ categoryId: e.target.value || null })}
        >
          <NativeSelectOption value="">No category</NativeSelectOption>
          {note.category &&
            !categories.some((c) => c.id === note.category?.id) && (
              <NativeSelectOption value={note.category.id}>
                {note.category.name}
              </NativeSelectOption>
            )}
          {categories.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>
              {c.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="note-tags" className="text-sm font-medium">
          Tags
        </label>
        <TagInput
          id="note-tags"
          value={tagNames}
          suggestions={tags.map((t) => t.name)}
          onChange={(next) => {
            setTagNames(next);
            save({ tags: next });
          }}
        />
      </div>
    </aside>
  );
}

function NoteWorkspace({ note }: { note: Note }) {
  const router = useRouter();
  const update = useUpdateNote(note.id);
  const remove = useDeleteNote(note.id);
  const [title, setTitle] = useState(
    note.title === DEFAULT_NOTE_TITLE ? '' : note.title,
  );
  const autosave = useAutosave<NoteInput>((changes) =>
    update.mutateAsync(changes),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackLink />
        <div className="flex items-center gap-2">
          <SaveStatus
            status={autosave.status}
            onRetry={() => void autosave.flush()}
          />
          <Button
            variant="outline"
            size="sm"
            aria-pressed={note.isPinned}
            onClick={() =>
              update.mutate(
                { isPinned: !note.isPinned },
                {
                  onError: (e) =>
                    toast.error(`Couldn't save. ${errorMessage(e)}`),
                },
              )
            }
          >
            {note.isPinned ? (
              <PinOffIcon aria-hidden="true" />
            ) : (
              <PinIcon aria-hidden="true" />
            )}
            {note.isPinned ? 'Unpin' : 'Pin'}
          </Button>
          <ConfirmDelete
            title={`Delete note "${note.title}"`}
            description="This can't be undone."
            pending={remove.isPending}
            onConfirm={(close) =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success(`Deleted "${note.title}"`);
                  router.push('/notes');
                },
                onError: (e) =>
                  toast.error(`Couldn't delete. ${errorMessage(e)}`),
                onSettled: close,
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-3">
          <label htmlFor="note-title" className="sr-only">
            Note title
          </label>
          <input
            id="note-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              autosave.queue({
                title: e.target.value.trim() || DEFAULT_NOTE_TITLE,
              });
            }}
            maxLength={200}
            placeholder={DEFAULT_NOTE_TITLE}
            className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-3xl"
          />
          <NoteEditor
            initialContent={note.content}
            onChange={(content) => autosave.queue({ content })}
          />
        </div>
        <OrganisePanel note={note} />
      </div>
    </div>
  );
}

/** /notes/<id>: write with autosave, and organise the note. */
export function NoteDetailView() {
  const { id } = useParams<{ id: string }>();
  const note = useNote(id);

  if (note.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading note">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-[50vh] w-full rounded-xl" />
      </div>
    );
  }
  if (note.isError) {
    const notFound =
      note.error instanceof ApiError && [400, 404].includes(note.error.status);
    return (
      <div className="space-y-4">
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={SearchXIcon}
            title="Note not found"
            description="It may have been deleted, or the link is wrong."
          />
        ) : (
          <FormErrorAlert error={note.error} />
        )}
      </div>
    );
  }
  // key: a different note starts a fresh editor (never re-key on each save).
  return <NoteWorkspace key={note.data.id} note={note.data} />;
}
