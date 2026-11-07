'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheckIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { FieldGroup } from '@/components/ui/field';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';
import { useForgotPassword } from '../use-auth';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  if (forgot.isSuccess) {
    // Same message whether or not the account exists (the API never says).
    return (
      <div role="status" className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-lavender-soft text-lavender-deep">
          <MailCheckIcon className="size-6" aria-hidden="true" />
        </div>
        <p className="text-sm">
          If an account exists for <strong>{getValues('email')}</strong>,
          we&apos;ve sent a link to reset the password.
        </p>
        <p className="text-sm text-muted-foreground">
          The link works for 30 minutes. Check your spam folder if you
          don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(({ email }) => forgot.mutate(email))}
      noValidate
    >
      <FieldGroup>
        <FormErrorAlert error={forgot.error} />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email}
          {...register('email')}
        />
        <SubmitButton pending={forgot.isPending} pendingText="Sending…">
          Send reset link
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
