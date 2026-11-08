'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryKeys, ideaKeys } from '@/features/ideas/use-ideas';
import { projectsApi } from './api';
import type { ProjectFilters } from './filters';
import type { ConvertIdeaInput, ProjectInput } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

export function useProjects(filters: ProjectFilters) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(filters),
    queryFn: ({ pageParam }) => projectsApi.list(filters, pageParam),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.get(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.create(input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/** Turning an idea into a project changes both: refresh projects AND ideas. */
export function useConvertIdea(ideaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConvertIdeaInput) =>
      projectsApi.convertIdea(ideaId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
    },
  });
}
