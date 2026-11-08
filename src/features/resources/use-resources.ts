'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryKeys, tagKeys } from '@/features/ideas/use-ideas';
import { projectKeys } from '@/features/projects/use-projects';
import { api } from '@/lib/api-client';
import { resourceFiltersToParams, type ResourceFilters } from './filters';
import type { Resource, ResourceInput, ResourcePage } from './types';

export const RESOURCES_PAGE_SIZE = 25;

export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: ResourceFilters) =>
    [...resourceKeys.lists(), filters] as const,
};

export const resourcesApi = {
  list: (
    filters: ResourceFilters,
    page: number,
    pageSize = RESOURCES_PAGE_SIZE,
  ) => {
    const params = resourceFiltersToParams(filters);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return api.get<ResourcePage>(`/resources?${params.toString()}`);
  },
  create: (input: ResourceInput) => api.post<Resource>('/resources', input),
  update: (id: string, input: ResourceInput) =>
    api.patch<Resource>(`/resources/${id}`, input),
  remove: (id: string) => api.delete(`/resources/${id}`),
};

export function useResources(filters: ResourceFilters, pageSize?: number) {
  return useInfiniteQuery({
    queryKey: [...resourceKeys.list(filters), pageSize ?? RESOURCES_PAGE_SIZE],
    queryFn: ({ pageParam }) => resourcesApi.list(filters, pageParam, pageSize),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

function useResourcesChanged() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  };
}

export function useCreateResource() {
  const changed = useResourcesChanged();
  return useMutation({
    mutationFn: (input: ResourceInput) => resourcesApi.create(input),
    onSuccess: changed,
  });
}

export function useUpdateResource() {
  const changed = useResourcesChanged();
  return useMutation({
    mutationFn: ({ id, ...input }: ResourceInput & { id: string }) =>
      resourcesApi.update(id, input),
    onSuccess: changed,
  });
}

export function useDeleteResource() {
  const changed = useResourcesChanged();
  return useMutation({
    mutationFn: (id: string) => resourcesApi.remove(id),
    onSuccess: changed,
  });
}
