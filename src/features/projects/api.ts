import { api } from '@/lib/api-client';
import { projectFiltersToApiParams, type ProjectFilters } from './filters';
import type {
  ActivityEntry,
  ConvertIdeaInput,
  MilestoneInput,
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
  activity: (id: string) =>
    api.get<ActivityEntry[]>(`/projects/${id}/activity?limit=50`),
  linkIdea: (id: string, ideaId: string) =>
    api.post<Project>(`/projects/${id}/ideas`, { ideaId }),
  unlinkIdea: (id: string, ideaId: string) =>
    api.delete<Project>(`/projects/${id}/ideas/${ideaId}`),
};

/** Every milestone change returns the whole updated project (with new progress). */
export const milestonesApi = {
  add: (projectId: string, input: MilestoneInput) =>
    api.post<Project>(`/projects/${projectId}/milestones`, input),
  update: (id: string, input: MilestoneInput & { completed?: boolean }) =>
    api.patch<Project>(`/milestones/${id}`, input),
  remove: (id: string) => api.delete<Project>(`/milestones/${id}`),
  reorder: (projectId: string, milestoneIds: string[]) =>
    api.put<Project>(`/projects/${projectId}/milestones/order`, {
      milestoneIds,
    }),
};
