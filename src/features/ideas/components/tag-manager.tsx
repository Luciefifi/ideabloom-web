'use client';

import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tag } from '../types';
import { useTags } from '../use-ideas';
import { useDeleteTag, useRenameTag } from '../use-organize';
import { ConfirmDelete } from './confirm-delete';
import { normalizeTag, validateTag } from './tag-input';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function TagRow({ tag }: { tag: Tag }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const rename = useRenameTag();
  const remove = useDeleteTag();
  const count = tag.ideaCount ?? 0;
  const problem = validateTag(normalizeTag(name), []);

  if (editing) {
    return (
      <li className="space-y-2 rounded-lg border p-3">
        <FormErrorAlert error={rename.error} />
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (problem || !normalizeTag(name)) return;
            rename.mutate(
              { id: tag.id, name: normalizeTag(name) },
              {
                onSuccess: () => {
                  setEditing(false);
                  toast.success('Tag renamed');
                },
              },
            );
          }}
        >
          <label htmlFor={`tag-${tag.id}`} className="sr-only">
            New name for tag {tag.name}
          </label>
          <Input
            id={`tag-${tag.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
            aria-invalid={!!problem}
            className="h-9 sm:max-w-xs"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!!problem || !normalizeTag(name) || rename.isPending}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                rename.reset();
                setName(tag.name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
        {problem && <p className="text-sm text-destructive">{problem}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
      <span className="flex-1 truncate font-medium">#{tag.name}</span>
      <span className="text-sm text-muted-foreground">
        {plural(count, 'idea')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Rename tag "${tag.name}"`}
        onClick={() => setEditing(true)}
      >
        <PencilIcon aria-hidden="true" />
      </Button>
      <ConfirmDelete
        title={`Delete tag "${tag.name}"`}
        description={
          count > 0
            ? `It will be removed from ${plural(count, 'idea')}. The ideas themselves stay.`
            : 'No ideas use this tag.'
        }
        pending={remove.isPending}
        onConfirm={(close) =>
          remove.mutate(tag.id, {
            onSuccess: () => toast.success(`Deleted #${tag.name}`),
            onError: (error) =>
              toast.error(`Couldn't delete. ${errorMessage(error)}`),
            onSettled: close,
          })
        }
      />
    </li>
  );
}

export function TagManager() {
  const tags = useTags();

  if (tags.isPending) return <Skeleton className="h-24 w-full" />;
  if (tags.isError) return <FormErrorAlert error={tags.error} />;
  if (tags.data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tags yet. Add tags while editing an idea; they&apos;ll appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-1" aria-label="Tags">
      {tags.data.map((tag) => (
        <TagRow key={tag.id} tag={tag} />
      ))}
    </ul>
  );
}
