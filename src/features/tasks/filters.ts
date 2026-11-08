import {
  TASK_PRIORITIES,
  TASK_VIEWS,
  type TaskPriority,
  type TaskView,
} from './types';

export const TASK_SORTS = [
  'dueDate',
  'priority',
  'createdAt',
  'updatedAt',
  'completedAt',
  'title',
] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

/** Filters on the Tasks page; they live in the URL (defaults left out). */
export interface TaskFilters {
  view: TaskView;
  search: string;
  projectId: string; // '' = any, 'none' = no project
  priority: TaskPriority | 'none' | '';
  sort: TaskSort | '';
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  view: 'pending',
  search: '',
  projectId: '',
  priority: '',
  sort: '',
};

const oneOf = <T extends string>(list: readonly T[], value: string | null) =>
  value !== null && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;

export function taskFiltersFromParams(params: URLSearchParams): TaskFilters {
  return {
    view: oneOf(TASK_VIEWS, params.get('view')) ?? 'pending',
    search: params.get('search') ?? '',
    projectId: params.get('projectId') ?? '',
    priority: oneOf([...TASK_PRIORITIES, 'none'], params.get('priority')) ?? '',
    sort: oneOf(TASK_SORTS, params.get('sort')) ?? '',
  };
}

export function taskFiltersToParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters) as [
    keyof TaskFilters,
    string,
  ][]) {
    if (value && value !== DEFAULT_TASK_FILTERS[key]) params.set(key, value);
  }
  return params;
}

/** The API defaults to the pending view, so the URL params work as-is. */
export const taskFiltersToApiParams = taskFiltersToParams;

export function hasActiveTaskFilters(filters: TaskFilters): boolean {
  const { view: _view, ...rest } = filters;
  void _view;
  return Object.values(rest).some(Boolean);
}
