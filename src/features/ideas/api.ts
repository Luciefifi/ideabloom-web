import { api } from '@/lib/api-client';
import { filtersToParams, type IdeaFilters } from './filters';
import type {
  Category,
  CategoryColor,
  Idea,
  IdeaInput,
  IdeaPage,
  Tag,
} from './types';

export const IDEAS_PAGE_SIZE = 20;

export const ideasApi = {
  list: (filters: IdeaFilters, page: number) => {
    const params = filtersToParams(filters);
    params.set('page', String(page));
    params.set('pageSize', String(IDEAS_PAGE_SIZE));
    return api.get<IdeaPage>(`/ideas?${params.toString()}`);
  },
  get: (id: string) => api.get<Idea>(`/ideas/${id}`),
  create: (input: IdeaInput) => api.post<Idea>('/ideas', input),
  update: (id: string, input: IdeaInput) =>
    api.patch<Idea>(`/ideas/${id}`, input),
  archive: (id: string) => api.post<Idea>(`/ideas/${id}/archive`),
  restore: (id: string) => api.post<Idea>(`/ideas/${id}/restore`),
  remove: (id: string) => api.delete(`/ideas/${id}`),
};

export interface CategoryInput {
  name?: string;
  color?: CategoryColor;
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (input: CategoryInput) => api.post<Category>('/categories', input),
  update: (id: string, input: CategoryInput) =>
    api.patch<Category>(`/categories/${id}`, input),
  remove: (id: string) => api.delete(`/categories/${id}`),
};

export const tagsApi = {
  list: () => api.get<Tag[]>('/tags'),
  rename: (id: string, name: string) => api.patch<Tag>(`/tags/${id}`, { name }),
  remove: (id: string) => api.delete(`/tags/${id}`),
};
