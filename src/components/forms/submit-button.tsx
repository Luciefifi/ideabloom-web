import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface SubmitButtonProps {
  pending: boolean;
  children: React.ReactNode;
  pendingText: string;
}

/** A full-width submit button that shows progress and can't be double-clicked. */
export function SubmitButton({
  pending,
  children,
  pendingText,
}: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
