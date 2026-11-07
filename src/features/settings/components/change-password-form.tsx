'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { PasswordField } from '@/components/forms/text-field';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  changePasswordSchema,
  PASSWORD_MIN_LENGTH,
  type ChangePasswordValues,
} from '@/features/auth/schemas';
import { useChangePassword } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-client';

const emptyValues: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordForm() {
  const change = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyValues,
  });

  // A wrong current password (400) is shown on that field, not at the top.
  const isWrongCurrentPassword = (error: unknown) =>
    error instanceof ApiError &&
    error.status === 400 &&
    /current password/i.test(error.message);

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset(emptyValues);
          toast.success(
            'Password changed. Your other devices were logged out.',
          );
        },
        onError: (error) => {
          if (isWrongCurrentPassword(error)) {
            setError('currentPassword', { message: error.message });
          }
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormErrorAlert
          error={isWrongCurrentPassword(change.error) ? null : change.error}
        />
        <PasswordField
          id="currentPassword"
          label="Current password"
          autoComplete="current-password"
          error={errors.currentPassword}
          {...register('currentPassword')}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={errors.newPassword}
          {...register('newPassword')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={change.isPending}>
            {change.isPending && <Spinner aria-hidden="true" />}
            {change.isPending ? 'Changing…' : 'Change password'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
