'use client';

import { formatDistanceToNow } from 'date-fns';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { describeProjectActivity } from '../activity-text';
import { useProjectActivity } from '../use-projects';

/** The project's history, newest first, as a simple timeline. */
export function ProjectActivity({ projectId }: { projectId: string }) {
  const activity = useProjectActivity(projectId);

  if (activity.isPending) return <Skeleton className="h-24 w-full" />;
  if (activity.isError) return <FormErrorAlert error={activity.error} />;
  if (activity.data.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol
      className="relative space-y-4 border-l pl-5"
      aria-label="Project history"
    >
      {activity.data.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-card bg-lavender"
            aria-hidden="true"
          />
          <p className="text-sm">{describeProjectActivity(entry)}</p>
          <time
            dateTime={entry.createdAt}
            title={new Date(entry.createdAt).toLocaleString()}
            className="text-xs text-muted-foreground"
          >
            {formatDistanceToNow(new Date(entry.createdAt), {
              addSuffix: true,
            })}
          </time>
        </li>
      ))}
    </ol>
  );
}
