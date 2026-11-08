'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { projectKeys } from '@/features/projects/use-projects';
import { tasksApi } from './api';
import type { TaskFilters } from './filters';
import type { Task, TaskInput } from './types';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export function useTasks(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam }) => tasksApi.list(filters, pageParam),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ''),
    queryFn: () => tasksApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

/**
 * After any task change: refresh task lists and the task, AND projects,
 * because project progress is calculated from tasks.
 */
function useTasksChanged() {
  const queryClient = useQueryClient();
  return (task?: Task) => {
    if (task) {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      if (task.parentTaskId) {
        void queryClient.invalidateQueries({
          queryKey: taskKeys.detail(task.parentTaskId),
        });
      }
    }
    void queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  };
}

export function useCreateTask() {
  const changed = useTasksChanged();
  return useMutation({
    mutationFn: (input: TaskInput) => tasksApi.create(input),
    onSuccess: changed,
  });
}

export function useUpdateTask() {
  const changed = useTasksChanged();
  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) =>
      tasksApi.update(id, input),
    onSuccess: changed,
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const changed = useTasksChanged();
  return useMutation({
    mutationFn: (task: { id: string; parentTaskId: string | null }) =>
      tasksApi.remove(task.id),
    onSuccess: (_result, task) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(task.id) });
      if (task.parentTaskId) {
        void queryClient.invalidateQueries({
          queryKey: taskKeys.detail(task.parentTaskId),
        });
      }
      changed();
    },
  });
}
