import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { FormFallback } from '../form-fallback';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue to your ideas."
      footer={
        <>
          New to IdeaBloom?{' '}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {/* LoginForm reads ?next= from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<FormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
