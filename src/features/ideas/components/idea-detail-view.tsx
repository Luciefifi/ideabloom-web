'use client';

import { format } from 'date-fns';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  SearchXIcon,
  StarIcon,
  Trash2Icon,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ConvertIdeaDialog } from '@/features/projects/components/convert-idea-dialog';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ideaToFormValues } from '../idea-form-schema';
import type { Idea } from '../types';
import {
  useArchiveIdea,
  useDeleteIdea,
  useIdea,
  useRestoreIdea,
  useUpdateIdea,
} from '../use-ideas';
import { CategoryChip, PriorityIndicator, StatusBadge } from './idea-badges';
import { IdeaForm } from './idea-form';

function BackLink() {
  return (
    <Link
      href="/ideas"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
    >
      <ArrowLeftIcon aria-hidden="true" />
      All ideas
    </Link>
  );
}

export function IdeaDetailView() {
  const { id } = useParams<{ id: string }>();
  const idea = useIdea(id);

  if (idea.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading idea">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (idea.isError) {
    const notFound =
      idea.error instanceof ApiError && [400, 404].includes(idea.error.status);
    return (
      <div className="space-y-4">
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={SearchXIcon}
            title="Idea not found"
            description="It may have been deleted, or the link is wrong."
          />
        ) : (
          <FormErrorAlert error={idea.error} />
        )}
      </div>
    );
  }

  return <IdeaDetail idea={idea.data} />;
}

function IdeaDetail({ idea }: { idea: Idea }) {
  const router = useRouter();
  const update = useUpdateIdea(idea.id);
  const favorite = useUpdateIdea(idea.id);
  const archive = useArchiveIdea(idea.id);
  const restore = useRestoreIdea(idea.id);
  const remove = useDeleteIdea(idea.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onError = (action: string) => (error: unknown) =>
    toast.error(`Couldn't ${action}. ${errorMessage(error)}`);

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {idea.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={idea.status} />
            {idea.category && <CategoryChip category={idea.category} />}
            {idea.priority && <PriorityIndicator priority={idea.priority} />}
          </div>
          <p className="text-xs text-muted-foreground">
            Created {format(new Date(idea.createdAt), 'd MMM yyyy')} · Updated{' '}
            {format(new Date(idea.updatedAt), "d MMM yyyy 'at' HH:mm")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {idea.project ? (
            <Link
              href={`/projects/${idea.project.id}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              <FolderKanbanIcon aria-hidden="true" />
              Open project
            </Link>
          ) : (
            idea.status !== 'converted' && <ConvertIdeaDialog idea={idea} />
          )}
          <Button
            variant="outline"
            aria-pressed={idea.isFavorite}
            disabled={favorite.isPending}
            onClick={() =>
              favorite.mutate(
                { isFavorite: !idea.isFavorite },
                { onError: onError('update the favourite') },
              )
            }
          >
            <StarIcon
              className={cn(idea.isFavorite && 'fill-amber-400 text-amber-500')}
              aria-hidden="true"
            />
            {idea.isFavorite ? 'Favourite' : 'Add to favourites'}
          </Button>

          {idea.archivedAt ? (
            <Button
              variant="outline"
              disabled={restore.isPending}
              onClick={() =>
                restore.mutate(undefined, {
                  onSuccess: () => toast.success('Idea restored'),
                  onError: onError('restore the idea'),
                })
              }
            >
              <ArchiveRestoreIcon aria-hidden="true" />
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={archive.isPending}
              onClick={() =>
                archive.mutate(undefined, {
                  onSuccess: () =>
                    toast.success('Idea archived', {
                      action: {
                        label: 'Undo',
                        onClick: () => restore.mutate(),
                      },
                    }),
                  onError: onError('archive the idea'),
                })
              }
            >
              <ArchiveIcon aria-hidden="true" />
              Archive
            </Button>
          )}

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogTrigger
              render={<Button variant="outline" className="text-destructive" />}
            >
              <Trash2Icon aria-hidden="true" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{idea.title}&rdquo; and its links will be deleted
                  permanently. To keep it out of the way instead, archive it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={remove.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(undefined, {
                      onSuccess: () => {
                        toast.success(`Deleted "${idea.title}"`);
                        router.push('/ideas');
                      },
                      onError: (error) => {
                        setConfirmDelete(false);
                        onError('delete the idea')(error);
                      },
                    })
                  }
                >
                  {remove.isPending && <Spinner aria-hidden="true" />}
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {idea.archivedAt && (
        <Alert>
          <ArchiveIcon aria-hidden="true" />
          <AlertDescription>
            Archived on {format(new Date(idea.archivedAt), 'd MMM yyyy')}.
            It&apos;s hidden from your idea list until you restore it.
          </AlertDescription>
        </Alert>
      )}

      {idea.links.length > 0 && (
        <section aria-label="Links" className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Links</h2>
          <ul className="space-y-1">
            {idea.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm break-all text-primary underline-offset-4 hover:underline"
                >
                  {link.label || link.url}
                  <ExternalLinkIcon
                    className="size-3 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="edit-idea"
        className="rounded-xl border bg-card p-5 sm:p-6"
      >
        <h2 id="edit-idea" className="mb-4 text-base font-semibold">
          Details
        </h2>
        {/* key: when the saved idea changes, the form starts from the new values */}
        <IdeaForm
          key={idea.updatedAt}
          defaultValues={ideaToFormValues(idea)}
          categoryName={idea.category?.name}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          pending={update.isPending}
          error={update.error}
          requireChanges
          onSubmit={(input) =>
            update.mutate(input, {
              onSuccess: () => toast.success('Idea saved'),
            })
          }
        />
      </section>
    </div>
  );
}
