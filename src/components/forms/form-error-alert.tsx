import { CircleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError, NetworkError } from '@/lib/api-client';

/** Turns any error into a sentence a person can act on. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Shows a request error above a form (e.g. "Invalid email or password."). */
export function FormErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;

  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon aria-hidden="true" />
      <AlertDescription>{errorMessage(error)}</AlertDescription>
    </Alert>
  );
}
