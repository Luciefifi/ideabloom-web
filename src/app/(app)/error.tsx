'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

/** Any unexpected error inside the app shows this, with the sidebar still usable. */
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState retry={retry} />;
}
