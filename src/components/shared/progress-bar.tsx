import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percent: number;
  /** Read by screen readers, e.g. "Project progress". */
  label: string;
  className?: string;
  /** Green when finished. */
  complete?: boolean;
}

/** A thin accessible progress bar (role="progressbar" with its value). */
export function ProgressBar({
  percent,
  label,
  className,
  complete,
}: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300',
          complete ? 'bg-emerald-500' : 'bg-lavender',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
