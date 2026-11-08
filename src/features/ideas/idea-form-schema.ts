import { z } from 'zod';
import type { Idea, IdeaInput } from './types';
import { IDEA_PRIORITIES } from './types';

/** Mirrors the API's rules for instant feedback (the API checks again). */
export const ideaFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Use at most 200 characters'),
  description: z.string().max(10_000, 'Use at most 10,000 characters'),
  status: z.enum(['inbox', 'exploring', 'planned', 'converted']),
  priority: z.enum([...IDEA_PRIORITIES, '']),
  categoryId: z.string(),
  tags: z.array(z.string()).max(20, 'At most 20 tags'),
  links: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .min(1, 'Enter a web address')
          .refine(
            (value) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(value),
            'Use a full address starting with http:// or https://',
          ),
        label: z.string().trim().max(200, 'Use at most 200 characters'),
      }),
    )
    .max(20, 'At most 20 links'),
});

export type IdeaFormValues = z.infer<typeof ideaFormSchema>;

export const emptyIdeaForm: IdeaFormValues = {
  title: '',
  description: '',
  status: 'inbox',
  priority: '',
  categoryId: '',
  tags: [],
  links: [],
};

export function ideaToFormValues(idea: Idea): IdeaFormValues {
  return {
    title: idea.title,
    description: idea.description ?? '',
    status: idea.status,
    priority: idea.priority ?? '',
    categoryId: idea.category?.id ?? '',
    tags: idea.tags.map((tag) => tag.name),
    links: idea.links.map((link) => ({
      url: link.url,
      label: link.label ?? '',
    })),
  };
}

/** Form values → API body ("" means "none" for the optional fields). */
export function formValuesToInput(values: IdeaFormValues): IdeaInput {
  return {
    title: values.title,
    description: values.description.trim() || null,
    // "converted" is never sent: it can't be chosen, only kept.
    ...(values.status !== 'converted' && { status: values.status }),
    priority: values.priority || null,
    categoryId: values.categoryId || null,
    tags: values.tags,
    links: values.links.map((link) => ({
      url: link.url.trim(),
      label: link.label.trim() || null,
    })),
  };
}
