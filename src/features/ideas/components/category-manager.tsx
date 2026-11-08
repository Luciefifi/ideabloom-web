'use client';

import { PencilIcon, PlusIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { describeUsage } from '@/lib/usage';
import { cn } from '@/lib/utils';
import { categoryStyle } from '../idea-styles';
import type { Category, CategoryColor } from '../types';
import { useCategories } from '../use-ideas';
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../use-organize';
import { ColorPicker } from './color-picker';
import { ConfirmDelete } from './confirm-delete';

function CategoryEditor({
  initialName = '',
  initialColor = 'lavender',
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initialName?: string;
  initialColor?: CategoryColor;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (name: string, color: CategoryColor) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<CategoryColor>(initialColor);
  const inputId = useId();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSubmit(name.trim(), color);
      }}
      className="space-y-3"
    >
      <FormErrorAlert error={error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor={inputId}>
          Category name
        </label>
        <Input
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          placeholder="Category name, e.g. Business"
          className="h-9 sm:max-w-xs"
        />
        <ColorPicker
          value={color}
          onChange={setColor}
          label="Category colour"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!name.trim() || pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const usage = describeUsage(category);

  if (editing) {
    return (
      <li className="rounded-lg border p-3">
        <CategoryEditor
          initialName={category.name}
          initialColor={category.color}
          submitLabel="Save"
          pending={update.isPending}
          error={update.error}
          onCancel={() => {
            update.reset();
            setEditing(false);
          }}
          onSubmit={(name, color) =>
            update.mutate(
              { id: category.id, name, color },
              {
                onSuccess: () => {
                  setEditing(false);
                  toast.success('Category saved');
                },
              },
            )
          }
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
      <span
        className={cn(
          'size-3 shrink-0 rounded-full',
          categoryStyle(category.color).dot,
        )}
        aria-hidden="true"
      />
      <span className="flex-1 truncate font-medium">{category.name}</span>
      <span className="text-sm text-muted-foreground">{usage.short}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit category "${category.name}"`}
        onClick={() => setEditing(true)}
      >
        <PencilIcon aria-hidden="true" />
      </Button>
      <ConfirmDelete
        title={`Delete category "${category.name}"`}
        description={
          usage.total > 0
            ? `Used by ${usage.text}. Nothing else is deleted: ${usage.total === 1 ? 'it becomes' : 'they become'} uncategorized.`
            : 'Nothing uses this category.'
        }
        pending={remove.isPending}
        onConfirm={(close) =>
          remove.mutate(category.id, {
            onSuccess: () => toast.success(`Deleted "${category.name}"`),
            onError: (error) =>
              toast.error(`Couldn't delete. ${errorMessage(error)}`),
            onSettled: close,
          })
        }
      />
    </li>
  );
}

export function CategoryManager() {
  const categories = useCategories();
  const create = useCreateCategory();
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="space-y-5">
      <CategoryEditor
        key={formKey}
        submitLabel="Add category"
        pending={create.isPending}
        error={create.error}
        onSubmit={(name, color) =>
          create.mutate(
            { name, color },
            {
              onSuccess: () => {
                toast.success(`Added "${name}"`);
                create.reset();
                setFormKey((k) => k + 1); // fresh, empty form
              },
            },
          )
        }
      />

      {categories.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : categories.isError ? (
        <FormErrorAlert error={categories.error} />
      ) : categories.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <PlusIcon className="mr-1 inline size-4" aria-hidden="true" />
          No categories yet. Add one above, like &ldquo;Business&rdquo; or
          &ldquo;Learning&rdquo;.
        </p>
      ) : (
        <ul className="space-y-1" aria-label="Categories">
          {categories.data.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </div>
  );
}
