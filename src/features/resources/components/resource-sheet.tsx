'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  errorMessage,
  FormErrorAlert,
} from '@/components/forms/form-error-alert';
import { TextField } from '@/components/forms/text-field';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDelete } from '@/features/ideas/components/confirm-delete';
import { TagInput } from '@/features/ideas/components/tag-input';
import { useCategories, useTags } from '@/features/ideas/use-ideas';
import { AttachSelect } from '@/features/library/attach-select';
import { attachmentOf, type Attachment } from '@/features/library/types';
import { guessResourceType, RESOURCE_TYPE_LABELS } from '../resource-styles';
import { RESOURCE_TYPES, type Resource, type ResourceInput } from '../types';
import {
  useCreateResource,
  useDeleteResource,
  useUpdateResource,
} from '../use-resources';

export const resourceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Use at most 200 characters'),
  url: z
    .string()
    .trim()
    .max(2000, 'This link is too long')
    .refine((value) => /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(value), {
      message: 'Enter a full web address starting with https://',
    }),
  type: z.enum(RESOURCE_TYPES),
  description: z.string().max(2000, 'Use at most 2,000 characters'),
  notes: z.string().max(10_000, 'Use at most 10,000 characters'),
  categoryId: z.string(),
  tags: z.array(z.string()),
  attachment: z.object({
    ideaId: z.string().nullable(),
    projectId: z.string().nullable(),
  }),
});
type ResourceFormValues = z.infer<typeof resourceFormSchema>;

function ResourceForm({
  resource,
  attachTo,
  onDone,
}: {
  resource: Resource | null;
  attachTo?: Partial<Attachment>;
  onDone: () => void;
}) {
  const create = useCreateResource();
  const update = useUpdateResource();
  const remove = useDeleteResource();
  const mutation = resource ? update : create;
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getFieldState,
    formState: { errors, isDirty },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: resource?.title ?? '',
      url: resource?.url ?? '',
      type: resource?.type ?? 'website',
      description: resource?.description ?? '',
      notes: resource?.notes ?? '',
      categoryId: resource?.category?.id ?? '',
      tags: resource?.tags.map((t) => t.name) ?? [],
      attachment: resource
        ? attachmentOf(resource)
        : {
            ideaId: attachTo?.ideaId ?? null,
            projectId: attachTo?.projectId ?? null,
          },
    },
  });

  const urlField = register('url');

  const submit = handleSubmit((v) => {
    const input: ResourceInput = {
      title: v.title,
      url: v.url,
      type: v.type,
      description: v.description.trim() || null,
      notes: v.notes.trim() || null,
      categoryId: v.categoryId || null,
      tags: v.tags,
      ideaId: v.attachment.ideaId,
      projectId: v.attachment.projectId,
    };
    const done = {
      onSuccess: () => {
        toast.success(resource ? 'Resource saved' : `Saved "${v.title}"`);
        onDone();
      },
    };
    if (resource) update.mutate({ id: resource.id, ...input }, done);
    else create.mutate(input, done);
  });

  return (
    <form noValidate onSubmit={submit}>
      <FieldGroup>
        <FormErrorAlert error={mutation.error} />
        <TextField
          id="resource-url"
          label="Link"
          type="url"
          inputMode="url"
          placeholder="https://"
          error={errors.url}
          {...urlField}
          onChange={(e) => {
            void urlField.onChange(e);
            // Suggest a type, unless you already picked one yourself.
            const guess = guessResourceType(e.target.value.trim());
            if (guess && !getFieldState('type').isDirty) {
              setValue('type', guess);
            }
          }}
        />
        <TextField
          id="resource-title"
          label="Title"
          error={errors.title}
          {...register('title')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="resource-type">Type</FieldLabel>
            <NativeSelect
              id="resource-type"
              className="w-full"
              {...register('type')}
            >
              {RESOURCE_TYPES.map((t) => (
                <NativeSelectOption key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="resource-category">Category</FieldLabel>
            {/* Controlled: the categories may load after the form appears. */}
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <NativeSelect
                  id="resource-category"
                  className="w-full"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <NativeSelectOption value="">No category</NativeSelectOption>
                  {resource?.category &&
                    !categories.some((c) => c.id === resource.category?.id) && (
                      <NativeSelectOption value={resource.category.id}>
                        {resource.category.name}
                      </NativeSelectOption>
                    )}
                  {categories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="resource-description">
            What is it about?
          </FieldLabel>
          <Textarea
            id="resource-description"
            rows={2}
            {...register('description')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="resource-notes">Your notes</FieldLabel>
          <Textarea id="resource-notes" rows={4} {...register('notes')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="resource-tags">Tags</FieldLabel>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput
                id="resource-tags"
                value={field.value}
                onChange={field.onChange}
                suggestions={tags.map((t) => t.name)}
              />
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="resource-attach">Attached to</FieldLabel>
          <Controller
            control={control}
            name="attachment"
            render={({ field }) => (
              <AttachSelect
                id="resource-attach"
                value={field.value}
                onChange={field.onChange}
                current={resource ?? undefined}
              />
            )}
          />
        </Field>
        <div className="flex items-center justify-between gap-2">
          {resource ? (
            <ConfirmDelete
              title={`Delete resource "${resource.title}"`}
              description="This can't be undone."
              pending={remove.isPending}
              onConfirm={(close) =>
                remove.mutate(resource.id, {
                  onSuccess: () => {
                    toast.success(`Deleted "${resource.title}"`);
                    onDone();
                  },
                  onError: (e) =>
                    toast.error(`Couldn't delete. ${errorMessage(e)}`),
                  onSettled: close,
                })
              }
            />
          ) : (
            <span />
          )}
          <Button
            type="submit"
            disabled={mutation.isPending || (resource !== null && !isDirty)}
          >
            {mutation.isPending && <Spinner aria-hidden="true" />}
            {resource ? 'Save changes' : 'Save resource'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

/**
 * Side panel to add (`resource = null`) or edit a resource.
 * `attachTo` pre-selects an idea/project when adding from its page.
 */
export function ResourceSheet({
  open,
  onOpenChange,
  resource,
  attachTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  attachTo?: Partial<Attachment>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{resource ? 'Edit resource' : 'New resource'}</SheetTitle>
          <SheetDescription>
            Save a link with a few words about why it&apos;s useful.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {open && (
            <ResourceForm
              key={resource?.updatedAt ?? 'new'}
              resource={resource}
              attachTo={attachTo}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
