'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { PRIORITY_LABELS } from '@/features/ideas/idea-styles';
import { useCategories } from '@/features/ideas/use-ideas';
import {
  emptyProjectForm,
  projectFormSchema,
  projectFormToInput,
  type ProjectFormValues,
} from '../project-form-schema';
import { PROJECT_STATUS_LABELS } from '../project-styles';
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectInput,
} from '../types';

interface ProjectFormProps {
  defaultValues?: ProjectFormValues;
  /** Shown while the category list loads, so the saved category isn't lost. */
  categoryName?: string;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (input: ProjectInput) => void;
  onCancel?: () => void;
  requireChanges?: boolean;
}

export function ProjectForm({
  defaultValues = emptyProjectForm,
  categoryName,
  submitLabel,
  pendingLabel,
  pending,
  error,
  onSubmit,
  onCancel,
  requireChanges = false,
}: ProjectFormProps) {
  const { data: categories = [] } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(projectFormToInput(values)))}
      noValidate
    >
      <FieldGroup>
        <FormErrorAlert error={error} />

        <TextField
          id="project-title"
          label="Title"
          error={errors.title}
          {...register('title')}
        />

        <Field data-invalid={!!errors.goals}>
          <FieldLabel htmlFor="project-goals">Goals</FieldLabel>
          <Textarea
            id="project-goals"
            rows={3}
            placeholder="What does success look like? (optional)"
            {...register('goals')}
          />
          <FieldError errors={[errors.goals]} />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="project-description">Description</FieldLabel>
          <Textarea
            id="project-description"
            rows={4}
            placeholder="Background, scope, notes… (optional)"
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="project-status">Status</FieldLabel>
            <NativeSelect
              id="project-status"
              className="w-full"
              {...register('status')}
            >
              {PROJECT_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="project-priority">Priority</FieldLabel>
            <NativeSelect
              id="project-priority"
              className="w-full"
              {...register('priority')}
            >
              <NativeSelectOption value="">None</NativeSelectOption>
              {PROJECT_PRIORITIES.map((p) => (
                <NativeSelectOption key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="project-category">Category</FieldLabel>
            {/* Controlled: categories may load after the form appears. */}
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <NativeSelect
                  id="project-category"
                  className="w-full"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <NativeSelectOption value="">No category</NativeSelectOption>
                  {field.value &&
                    !categories.some((c) => c.id === field.value) &&
                    field.value === defaultValues.categoryId && (
                      <NativeSelectOption value={field.value}>
                        {categoryName ?? 'Current category'}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="project-start">Start date</FieldLabel>
            <input
              id="project-start"
              type="date"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register('startDate')}
            />
          </Field>
          <Field data-invalid={!!errors.targetDate}>
            <FieldLabel htmlFor="project-target">Target date</FieldLabel>
            <input
              id="project-target"
              type="date"
              aria-invalid={!!errors.targetDate}
              aria-describedby="project-target-help"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              {...register('targetDate')}
            />
            <FieldDescription id="project-target-help">
              Shown as overdue once it passes.
            </FieldDescription>
            <FieldError errors={[errors.targetDate]} />
          </Field>
        </div>

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
