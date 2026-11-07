import { Spinner } from '@/components/ui/spinner';

/** Shown for a split second while a form that reads the URL loads. */
export function FormFallback() {
  return (
    <div className="flex justify-center py-10 text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  );
}
