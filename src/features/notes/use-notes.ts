'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryKeys, tagKeys } from '@/features/ideas/use-ideas';
import { projectKeys } from '@/features/projects/use-projects';
import { api } from '@/lib/api-client';
import { noteFiltersToParams, type NoteFilters } from './filters';
import type { Note, NoteInput, NotePage } from './types';

export const NOTES_PAGE_SIZE = 24;

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: NoteFilters) => [...noteKeys.lists(), filters] as const,
  detail: (id: string) => [...noteKeys.all, 'detail', id] as const,
};

export const notesApi = {
  list: (filters: NoteFilters, page: number, pageSize = NOTES_PAGE_SIZE) => {
    const params = noteFiltersToParams(filters);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return api.get<NotePage>(`/notes?${params.toString()}`);
  },
  get: (id: string) => api.get<Note>(`/notes/${id}`),
  create: (input: NoteInput) => api.post<Note>('/notes', input),
  update: (id: string, input: NoteInput) =>
    api.patch<Note>(`/notes/${id}`, input),
  remove: (id: string) => api.delete(`/notes/${id}`),
};

export function useNotes(filters: NoteFilters, pageSize?: number) {
  return useInfiniteQuery({
    queryKey: [...noteKeys.list(filters), pageSize ?? NOTES_PAGE_SIZE],
    queryFn: ({ pageParam }) => notesApi.list(filters, pageParam, pageSize),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.get(id),
    // The editor owns the text while you type; don't refetch it from under you.
    refetchOnWindowFocus: false,
  });
}

/**
 * Note lists always change. Tag/category counts and project timelines only
 * change when a note is organised (not on every autosave of the text).
 */
function useNotesChanged() {
  const queryClient = useQueryClient();
  return (note?: Note, organised = true) => {
    if (note) queryClient.setQueryData(noteKeys.detail(note.id), note);
    void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    if (!organised) return;
    void queryClient.invalidateQueries({ queryKey: tagKeys.all });
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  };
}

export function useCreateNote() {
  const changed = useNotesChanged();
  return useMutation({
    mutationFn: (input: NoteInput) => notesApi.create(input),
    onSuccess: (note) => changed(note),
  });
}

/** Used for autosave and for the pin/category/tags/attach controls. */
export function useUpdateNote(id: string) {
  const changed = useNotesChanged();
  return useMutation({
    mutationFn: (input: NoteInput) => notesApi.update(id, input),
    onSuccess: (note, input) =>
      changed(
        note,
        Object.keys(input).some((key) => key !== 'title' && key !== 'content'),
      ),
  });
}

export function useDeleteNote(id: string) {
  const queryClient = useQueryClient();
  const changed = useNotesChanged();
  return useMutation({
    mutationFn: () => notesApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
      changed();
    },
  });
}
