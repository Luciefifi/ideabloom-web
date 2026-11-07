'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { SubmitButton } from '@/components/forms/submit-button';
import { PasswordField, TextField } from '@/components/forms/text-field';
import { FieldGroup } from '@/components/ui/field';
import { ApiError } from '@/lib/api-client';
import { DEFAULT_AFTER_LOGIN } from '@/lib/auth-routes';
import {
  PASSWORD_MIN_LENGTH,
  registerSchema,
  type RegisterValues,
} from '../schemas';
import { useRegister } from '../use-auth';

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(({ displayName, email, password }) => {
    registerUser.mutate(
      { displayName, email, password },
      {
        onSuccess: (user) => {
          toast.success(`Welcome to IdeaBloom, ${user.displayName}!`);
          router.replace(DEFAULT_AFTER_LOGIN);
        },
        onError: (error) => {
          // Show "email already exists" next to the email field, where it belongs.
          if (error instanceof ApiError && error.status === 409) {
            setError('email', { message: error.message });
          }
        },
      },
    );
  });

  // A 409 is shown on the email field instead of the alert at the top.
  const formError =
    registerUser.error instanceof ApiError && registerUser.error.status === 409
      ? null
      : registerUser.error;

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormErrorAlert error={formError} />
        <TextField
          id="displayName"
          label="Name"
          autoComplete="name"
          autoFocus
          error={errors.displayName}
          {...register('displayName')}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          description={`At least ${PASSWORD_MIN_LENGTH} characters. A short sentence works well.`}
          error={errors.password}
          {...register('password')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <SubmitButton
          pending={registerUser.isPending}
          pendingText="Creating your account…"
        >
          Create account
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
