'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { TextField } from '@/components/forms/text-field';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  emptyIdeaForm,
  formValuesToInput,
  ideaFormSchema,
  type IdeaFormValues,
} from '../idea-form-schema';
import { PRIORITY_LABELS, STATUS_LABELS } from '../idea-styles';
import {
  EDITABLE_IDEA_STATUSES,
  IDEA_PRIORITIES,
  type IdeaInput,
} from '../types';
import { useCategories, useTags } from '../use-ideas';
import { TagInput } from './tag-input';

interface IdeaFormProps {
  defaultValues?: IdeaFormValues;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (input: IdeaInput, values: IdeaFormValues) => void;
  onCancel?: () => void;
  /** Disable "save" until something changes (for editing). */
  requireChanges?: boolean;
  /** Name of the saved category, shown while the category list loads. */
  categoryName?: string;
}

/** All of an idea's fields. Used by "New idea" and by the idea page. */
export function IdeaForm({
  defaultValues = emptyIdeaForm,
  submitLabel,
  pendingLabel,
  pending,
  error,
  onSubmit,
  onCancel,
  requireChanges = false,
  categoryName,
}: IdeaFormProps) {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues,
  });
  const links = useFieldArray({ control, name: 'links' });
  const isConverted = defaultValues.status === 'converted';

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit(formValuesToInput(values), values),
      )}
      noValidate
    >
      <FieldGroup>
        <FormErrorAlert error={error} />

        <TextField
          id="idea-title"
          label="Title"
          error={errors.title}
          {...register('title')}
        />

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="idea-description">Description</FieldLabel>
          <Textarea
            id="idea-description"
            rows={5}
            placeholder="What's the idea? Why does it matter? (optional)"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="idea-status">Status</FieldLabel>
            {isConverted ? (
              <p id="idea-status" className="text-sm text-muted-foreground">
                {STATUS_LABELS.converted}
              </p>
            ) : (
              <NativeSelect
                id="idea-status"
                className="w-full"
                {...register('status')}
              >
                {EDITABLE_IDEA_STATUSES.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="idea-priority">Priority</FieldLabel>
            <NativeSelect
              id="idea-priority"
              className="w-full"
              {...register('priority')}
            >
              <NativeSelectOption value="">None</NativeSelectOption>
              {IDEA_PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="idea-category">Category</FieldLabel>
            {/*
              Controlled (not register): the categories may load AFTER the form
              appears. An uncontrolled select would fall back to "No category"
              and saving would silently remove the idea's category.
            */}
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <NativeSelect
                  id="idea-category"
                  className="w-full"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <NativeSelectOption value="">No category</NativeSelectOption>
                  {/* Keep the saved category selectable while the list loads. */}
                  {field.value &&
                    !categories.some((c) => c.id === field.value) &&
                    defaultValues.categoryId === field.value && (
                      <NativeSelectOption value={field.value}>
                        {categoryName ?? 'Current category'}
                      </NativeSelectOption>
                    )}
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="idea-tags">Tags</FieldLabel>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput
                id="idea-tags"
                value={field.value}
                onChange={field.onChange}
                suggestions={tags.map((tag) => tag.name)}
                aria-describedby="idea-tags-help"
              />
            )}
          />
          <FieldDescription id="idea-tags-help">
            Press Enter or comma after each tag. New tags are created
            automatically.
          </FieldDescription>
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Links & references</legend>
          {links.fields.map((link, index) => (
            <div
              key={link.id}
              className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]"
            >
              <div>
                <label htmlFor={`link-url-${index}`} className="sr-only">
                  Link {index + 1} address
                </label>
                <Input
                  id={`link-url-${index}`}
                  type="url"
                  placeholder="https://…"
                  aria-invalid={!!errors.links?.[index]?.url}
                  {...register(`links.${index}.url`)}
                />
                <FieldError
                  errors={[errors.links?.[index]?.url]}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor={`link-label-${index}`} className="sr-only">
                  Link {index + 1} label
                </label>
                <Input
                  id={`link-label-${index}`}
                  placeholder="Label (optional)"
                  {...register(`links.${index}.label`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => links.remove(index)}
                aria-label={`Remove link ${index + 1}`}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => links.append({ url: '', label: '' })}
            disabled={links.fields.length >= 20}
          >
            <PlusIcon aria-hidden="true" />
            Add link
          </Button>
        </fieldset>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={pending || (requireChanges && !isDirty)}
          >
            {pending && <Spinner aria-hidden="true" />}
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
