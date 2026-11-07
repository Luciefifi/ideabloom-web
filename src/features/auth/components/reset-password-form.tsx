'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { SubmitButton } from '@/components/forms/submit-button';
import { PasswordField } from '@/components/forms/text-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { LOGIN_PATH } from '@/lib/auth-routes';
import {
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type ResetPasswordValues,
} from '../schemas';
import { useResetPassword } from '../use-auth';

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const reset = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          This reset link is incomplete. Please{' '}
          <Link href="/forgot-password" className="font-medium underline">
            request a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  const onSubmit = handleSubmit(({ password }) => {
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success(
            'Password changed. Please log in with your new password.',
          );
          router.replace(LOGIN_PATH);
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormErrorAlert error={reset.error} />
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          autoFocus
          description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={errors.password}
          {...register('password')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <SubmitButton pending={reset.isPending} pendingText="Saving…">
          Set new password
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
