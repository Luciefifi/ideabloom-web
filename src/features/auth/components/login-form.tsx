'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CheckCircle2Icon } from 'lucide-react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubmitButton } from '@/components/forms/submit-button';
import { PasswordField, TextField } from '@/components/forms/text-field';
import { FieldGroup } from '@/components/ui/field';
import { getSafeRedirect } from '@/lib/auth-routes';
import { loginSchema, type LoginValues } from '../schemas';
import { useLogin } from '../use-auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (user) => {
        toast.success(`Welcome back, ${user.displayName}!`);
        router.replace(
          getSafeRedirect(
            searchParams.get('next'),
            `/${user.preferences.startPage}`,
          ),
        );
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        {searchParams.get('deleted') === '1' && (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" />
            <AlertDescription>
              Your account and all its content were deleted.
            </AlertDescription>
          </Alert>
        )}
        <FormErrorAlert error={login.error} />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email}
          {...register('email')}
        />
        <div className="space-y-2">
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            error={errors.password}
            {...register('password')}
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        <SubmitButton pending={login.isPending} pendingText="Logging in…">
          Log in
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
