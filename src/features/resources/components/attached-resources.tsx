'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Attachment } from '@/features/library/types';
import { DEFAULT_RESOURCE_FILTERS } from '../filters';
import type { Resource } from '../types';
import { useResources } from '../use-resources';
import { ResourceRow } from './resource-row';
import { ResourceSheet } from './resource-sheet';

const SHOWN = 10;

/** The Resources section of an idea or project page. */
export function AttachedResources({
  attachTo,
}: {
  attachTo: Partial<Attachment>;
}) {
  const query = useResources(
    {
      ...DEFAULT_RESOURCE_FILTERS,
      ideaId: attachTo.ideaId ?? undefined,
      projectId: attachTo.projectId ?? undefined,
    },
    SHOWN,
  );
  const resources = query.data?.pages[0]?.data ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const [editing, setEditing] = useState<Resource | null | undefined>();

  return (
    <div className="space-y-3">
      {query.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : query.isError ? (
        <FormErrorAlert error={query.error} />
      ) : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources yet.</p>
      ) : (
        <ul aria-label="Attached resources" className="space-y-1">
          {resources.map((resource) => (
            <li key={resource.id}>
              <ResourceRow resource={resource} onEdit={setEditing} compact />
            </li>
          ))}
        </ul>
      )}
      {total > SHOWN && (
        <p className="text-xs text-muted-foreground">
          Showing the {SHOWN} most recent of {total}.
        </p>
      )}
      <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
        <PlusIcon aria-hidden="true" />
        Add resource
      </Button>
      <ResourceSheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        resource={editing ?? null}
        attachTo={attachTo}
      />
    </div>
  );
}
