'use client';

import { useQuery } from '@tanstack/react-query';
import { LinkIcon, UnlinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { StatusBadge } from '@/features/ideas/components/idea-badges';
import type { IdeaPage, IdeaStatus } from '@/features/ideas/types';
import { ideaKeys } from '@/features/ideas/use-ideas';
import { api } from '@/lib/api-client';
import type { Project } from '../types';
import { useLinkIdea, useUnlinkIdea } from '../use-projects';

/** Your active ideas (up to 100), to pick one to link. */
function useIdeaOptions() {
  return useQuery({
    queryKey: [...ideaKeys.lists(), 'picker'],
    queryFn: () => api.get<IdeaPage>('/ideas?sort=title&pageSize=100'),
  });
}

export function RelatedIdeas({ project }: { project: Project }) {
  const link = useLinkIdea(project.id);
  const unlink = useUnlinkIdea(project.id);
  const options = useIdeaOptions();
  const [selected, setSelected] = useState('');

  const linkedIds = new Set(project.relatedIdeas.map((i) => i.id));
  const available = (options.data?.data ?? []).filter(
    (i) => !linkedIds.has(i.id),
  );

  return (
    <div className="space-y-4">
      {project.relatedIdeas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ideas linked yet.</p>
      ) : (
        <ul className="space-y-1" aria-label="Related ideas">
          {project.relatedIdeas.map((idea) => {
            const isSource = project.sourceIdea?.id === idea.id;
            return (
              <li
                key={idea.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
              >
                <Link
                  href={`/ideas/${idea.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline"
                >
                  {idea.title}
                </Link>
                {isSource && (
                  <span className="text-xs text-muted-foreground">
                    Started from this idea
                  </span>
                )}
                <StatusBadge status={idea.status as IdeaStatus} />
                {!isSource && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Unlink "${idea.title}"`}
                    disabled={unlink.isPending}
                    onClick={() =>
                      unlink.mutate(idea.id, {
                        onError: (e) =>
                          toast.error(`Couldn't unlink. ${errorMessage(e)}`),
                      })
                    }
                  >
                    <UnlinkIcon aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="flex flex-col gap-2 border-t pt-4 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!selected) return;
          link.mutate(selected, {
            onSuccess: () => {
              setSelected('');
              toast.success('Idea linked');
            },
            onError: (e) => toast.error(`Couldn't link. ${errorMessage(e)}`),
          });
        }}
      >
        <NativeSelect
          aria-label="Idea to link"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full sm:flex-1"
          disabled={options.isPending}
        >
          <NativeSelectOption value="">
            {options.isPending ? 'Loading ideas…' : 'Choose an idea to link…'}
          </NativeSelectOption>
          {available.map((idea) => (
            <NativeSelectOption key={idea.id} value={idea.id}>
              {idea.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="submit"
          variant="outline"
          disabled={!selected || link.isPending}
        >
          <LinkIcon aria-hidden="true" />
          Link idea
        </Button>
      </form>
    </div>
  );
}
