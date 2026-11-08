'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryKeys, ideaKeys } from '@/features/ideas/use-ideas';
import { milestonesApi, projectsApi } from './api';
import type { ProjectFilters } from './filters';
import type {
  ConvertIdeaInput,
  MilestoneInput,
  Project,
  ProjectInput,
} from './types';

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

export function useProjectActivity(id: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(id), 'activity'] as const,
    queryFn: () => projectsApi.activity(id),
  });
}

/**
 * After a change to one project: store the returned project (so the page
 * updates instantly), and refresh lists, its activity and anything idea-related.
 */
function useProjectChanged() {
  const queryClient = useQueryClient();
  return (project?: Project) => {
    if (project)
      queryClient.setQueryData(projectKeys.detail(project.id), project);
    void queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    if (project) {
      void queryClient.invalidateQueries({
        queryKey: [...projectKeys.detail(project.id), 'activity'],
      });
    }
    void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
  };
}

export function useUpdateProject(id: string) {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.update(id, input),
    onSuccess: changed,
  });
}

export function useDeleteProject(id: string) {
  const queryClient = useQueryClient();
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: () => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      changed();
    },
  });
}

export function useAddMilestone(projectId: string) {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (input: MilestoneInput) => milestonesApi.add(projectId, input),
    onSuccess: changed,
  });
}

export function useUpdateMilestone() {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: MilestoneInput & { id: string; completed?: boolean }) =>
      milestonesApi.update(id, input),
    onSuccess: changed,
  });
}

export function useDeleteMilestone() {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (id: string) => milestonesApi.remove(id),
    onSuccess: changed,
  });
}

export function useReorderMilestones(projectId: string) {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (ids: string[]) => milestonesApi.reorder(projectId, ids),
    onSuccess: changed,
  });
}

export function useLinkIdea(projectId: string) {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (ideaId: string) => projectsApi.linkIdea(projectId, ideaId),
    onSuccess: changed,
  });
}

export function useUnlinkIdea(projectId: string) {
  const changed = useProjectChanged();
  return useMutation({
    mutationFn: (ideaId: string) => projectsApi.unlinkIdea(projectId, ideaId),
    onSuccess: changed,
  });
}
