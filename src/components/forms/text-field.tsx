'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TextFieldProps = React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  description?: string;
  error?: HookFormFieldError;
  /** Something shown inside the right edge of the input, e.g. a button. */
  trailing?: React.ReactNode;
};

/**
 * Label + input + help text + error message, wired up for accessibility:
 * the label points at the input, and screen readers announce the error
 * because the input is marked aria-invalid and described by the message.
 */
export function TextField({
  id,
  label,
  description,
  error,
  trailing,
  className,
  ...inputProps
}: TextFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={!!error}
          aria-describedby={
            [descriptionId, errorId].filter(Boolean).join(' ') || undefined
          }
          className={cn('h-9', trailing && 'pr-9', className)}
          {...inputProps}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {description && !error && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={[error]} />
    </Field>
  );
}

/** A password input with a show/hide button, so people can check what they typed. */
export function PasswordField(
  props: Omit<TextFieldProps, 'type' | 'trailing'>,
) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {visible ? (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
