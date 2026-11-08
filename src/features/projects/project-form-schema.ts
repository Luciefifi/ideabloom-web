import { z } from 'zod';
import type { Project, ProjectInput } from './types';
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from './types';

/** Mirrors the API rules for instant feedback (the API checks again). */
export const projectFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Use at most 200 characters'),
    description: z.string().max(10_000, 'Use at most 10,000 characters'),
    goals: z.string().max(10_000, 'Use at most 10,000 characters'),
    status: z.enum(PROJECT_STATUSES),
    priority: z.enum([...PROJECT_PRIORITIES, '']),
    categoryId: z.string(),
    // <input type="date"> gives "YYYY-MM-DD" or "" when empty.
    startDate: z.string(),
    targetDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.targetDate || v.targetDate >= v.startDate, {
    message: "The target date can't be before the start date",
    path: ['targetDate'],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const emptyProjectForm: ProjectFormValues = {
  title: '',
  description: '',
  goals: '',
  status: 'not_started',
  priority: '',
  categoryId: '',
  startDate: '',
  targetDate: '',
};

export function projectToFormValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    description: project.description ?? '',
    goals: project.goals ?? '',
    status: project.status,
    priority: project.priority ?? '',
    categoryId: project.category?.id ?? '',
    startDate: project.startDate ?? '',
    targetDate: project.targetDate ?? '',
  };
}

export function projectFormToInput(values: ProjectFormValues): ProjectInput {
  return {
    title: values.title,
    description: values.description.trim() || null,
    goals: values.goals.trim() || null,
    status: values.status,
    priority: values.priority || null,
    categoryId: values.categoryId || null,
    startDate: values.startDate || null,
    targetDate: values.targetDate || null,
  };
}
