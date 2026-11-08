'use client';

import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * Shown instead of a crashed page. The technical details are logged in the
 * browser console, never shown to the user.
 */
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          This part of the page couldn&apos;t load. Your data is safe. Try
          again, or go back to your dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry}>
          <RefreshCwIcon aria-hidden="true" />
          Try again
        </Button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'outline' })}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
