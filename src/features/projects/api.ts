import { api } from '@/lib/api-client';
import { projectFiltersToApiParams, type ProjectFilters } from './filters';
import type {
  ConvertIdeaInput,
  Project,
  ProjectInput,
  ProjectPage,
} from './types';

export const PROJECTS_PAGE_SIZE = 20;

export const projectsApi = {
  list: (filters: ProjectFilters, page: number) => {
    const params = projectFiltersToApiParams(filters);
    params.set('page', String(page));
    params.set('pageSize', String(PROJECTS_PAGE_SIZE));
    return api.get<ProjectPage>(`/projects?${params.toString()}`);
  },
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (input: ProjectInput) => api.post<Project>('/projects', input),
  update: (id: string, input: ProjectInput) =>
    api.patch<Project>(`/projects/${id}`, input),
  remove: (id: string) => api.delete(`/projects/${id}`),
  convertIdea: (ideaId: string, input: ConvertIdeaInput) =>
    api.post<Project>(`/ideas/${ideaId}/convert`, input),
};
