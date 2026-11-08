'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProjectPage } from '@/features/projects/types';
import { projectKeys } from '@/features/projects/use-projects';
import { api } from '@/lib/api-client';

/** All your projects (A to Z), for "which project?" pickers. */
export function useProjectOptions({ enabled = true } = {}) {
  return useQuery({
    enabled,
    queryKey: [...projectKeys.lists(), 'options'],
    queryFn: () =>
      api.get<ProjectPage>('/projects?scope=all&sort=title&pageSize=100'),
    select: (page) => page.data.map((p) => ({ id: p.id, title: p.title })),
  });
}
