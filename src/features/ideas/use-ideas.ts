'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import { categoriesApi, ideasApi, tagsApi } from './api';
import type { IdeaFilters } from './filters';
import type { Idea, IdeaInput, IdeaPage } from './types';

/**
 * Cache keys. Everything about ideas starts with ['ideas'], so one
 * invalidateQueries({ queryKey: ideaKeys.all }) refreshes every idea list.
 */
export const ideaKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideaKeys.all, 'list'] as const,
  list: (filters: IdeaFilters) => [...ideaKeys.lists(), filters] as const,
  detail: (id: string) => [...ideaKeys.all, 'detail', id] as const,
};
export const categoryKeys = { all: ['categories'] as const };
export const tagKeys = { all: ['tags'] as const };

/** One page at a time; "Load more" fetches the next page and appends it. */
export function useIdeas(filters: IdeaFilters) {
  return useInfiniteQuery({
    queryKey: ideaKeys.list(filters),
    queryFn: ({ pageParam }) => ideasApi.list(filters, pageParam),
    initialPageParam: 1,
    // Keep showing the current list while results for new filters load.
    placeholderData: keepPreviousData,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: categoriesApi.list });
}

export function useTags() {
  return useQuery({ queryKey: tagKeys.all, queryFn: tagsApi.list });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IdeaInput) => ideasApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
      // New tags may have been created, and counts changed.
      void queryClient.invalidateQueries({ queryKey: tagKeys.all });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

type ListCache = InfiniteData<IdeaPage, number> | undefined;

/**
 * Star / unstar. "Optimistic": the star changes instantly on screen, before
 * the API answers. If the API fails, the previous state is put back.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      ideasApi.update(id, { isFavorite }),

    onMutate: async ({ id, isFavorite }) => {
      // Stop in-flight refreshes from overwriting our instant change.
      await queryClient.cancelQueries({ queryKey: ideaKeys.lists() });
      const snapshot = queryClient.getQueriesData<ListCache>({
        queryKey: ideaKeys.lists(),
      });

      queryClient.setQueriesData<ListCache>(
        { queryKey: ideaKeys.lists() },
        (cache) =>
          cache && {
            ...cache,
            pages: cache.pages.map((page) => ({
              ...page,
              data: page.data.map((idea) =>
                idea.id === id ? { ...idea, isFavorite } : idea,
              ),
            })),
          },
      );
      return { snapshot };
    },

    onError: (error, _variables, context) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(`Couldn't update the favourite. ${errorMessage(error)}`);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ideaKeys.all }),
  });
}

export function useIdea(id: string) {
  return useQuery({
    queryKey: ideaKeys.detail(id),
    queryFn: () => ideasApi.get(id),
  });
}

/** After any change to one idea: refresh lists, counts and that idea's page. */
function useIdeaChanged() {
  const queryClient = useQueryClient();
  return (idea?: Idea) => {
    if (idea) queryClient.setQueryData(ideaKeys.detail(idea.id), idea);
    void queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
    void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  };
}

export function useUpdateIdea(id: string) {
  const changed = useIdeaChanged();
  return useMutation({
    mutationFn: (input: IdeaInput) => ideasApi.update(id, input),
    onSuccess: changed,
  });
}

export function useArchiveIdea(id: string) {
  const changed = useIdeaChanged();
  return useMutation({
    mutationFn: () => ideasApi.archive(id),
    onSuccess: changed,
  });
}

export function useRestoreIdea(id: string) {
  const changed = useIdeaChanged();
  return useMutation({
    mutationFn: () => ideasApi.restore(id),
    onSuccess: changed,
  });
}

export function useDeleteIdea(id: string) {
  const queryClient = useQueryClient();
  const changed = useIdeaChanged();
  return useMutation({
    mutationFn: () => ideasApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ideaKeys.detail(id) });
      changed();
    },
  });
}
