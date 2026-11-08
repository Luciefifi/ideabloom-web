import { api } from '@/lib/api-client';
import { taskFiltersToApiParams, type TaskFilters } from './filters';
import type { Task, TaskInput, TaskPage } from './types';

export const TASKS_PAGE_SIZE = 25;

export const tasksApi = {
  list: (filters: TaskFilters, page: number, pageSize = TASKS_PAGE_SIZE) => {
    const params = taskFiltersToApiParams(filters);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return api.get<TaskPage>(`/tasks?${params.toString()}`);
  },
  get: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (input: TaskInput) => api.post<Task>('/tasks', input),
  update: (id: string, input: TaskInput) =>
    api.patch<Task>(`/tasks/${id}`, input),
  remove: (id: string) => api.delete(`/tasks/${id}`),
};
