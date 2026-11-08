'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, tagsApi, type CategoryInput } from './api';
import { categoryKeys, ideaKeys, tagKeys } from './use-ideas';

/**
 * Categories and tags appear inside ideas, so changing one refreshes
 * the idea lists and pages too.
 */
function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
  };
}

export function useCreateCategory() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: refresh,
  });
}

export function useUpdateCategory() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ id, ...input }: CategoryInput & { id: string }) =>
      categoriesApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useDeleteCategory() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: refresh,
  });
}

export function useRenameTag() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      tagsApi.rename(id, name),
    onSuccess: refresh,
  });
}

export function useDeleteTag() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (id: string) => tagsApi.remove(id),
    onSuccess: refresh,
  });
}
