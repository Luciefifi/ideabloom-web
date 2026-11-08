'use client';

import { useQuery } from '@tanstack/react-query';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select';
import type { IdeaPage } from '@/features/ideas/types';
import { ideaKeys } from '@/features/ideas/use-ideas';
import { useProjectOptions } from '@/features/tasks/use-project-options';
import { api } from '@/lib/api-client';
import type { Attachment, TitleRef } from './types';

/** Your active ideas (A to Z), for "attach to" pickers. */
function useIdeaOptions() {
  return useQuery({
    queryKey: [...ideaKeys.all, 'options'],
    queryFn: () => api.get<IdeaPage>('/ideas?sort=title&pageSize=100'),
    select: (page) => page.data.map((i) => ({ id: i.id, title: i.title })),
  });
}

const encode = (a: Attachment) =>
  a.ideaId ? `idea:${a.ideaId}` : a.projectId ? `project:${a.projectId}` : '';

function decode(value: string): Attachment {
  const [kind, id] = value.split(':');
  return {
    ideaId: kind === 'idea' ? id : null,
    projectId: kind === 'project' ? id : null,
  };
}

interface AttachSelectProps {
  id: string;
  value: Attachment;
  onChange: (value: Attachment) => void;
  /** The current idea/project, shown even before the lists load (or if archived). */
  current?: { idea: TitleRef | null; project: TitleRef | null };
  disabled?: boolean;
}

/** "Not attached" / one of your ideas / one of your projects. */
export function AttachSelect({
  id,
  value,
  onChange,
  current,
  disabled,
}: AttachSelectProps) {
  const ideas = useIdeaOptions();
  const projects = useProjectOptions();

  const ideaList = withCurrent(ideas.data, current?.idea);
  const projectList = withCurrent(projects.data, current?.project);

  return (
    <NativeSelect
      id={id}
      className="w-full"
      value={encode(value)}
      disabled={disabled}
      onChange={(e) => onChange(decode(e.target.value))}
    >
      <NativeSelectOption value="">Not attached</NativeSelectOption>
      {projectList.length > 0 && (
        <NativeSelectOptGroup label="Projects">
          {projectList.map((p) => (
            <NativeSelectOption key={p.id} value={`project:${p.id}`}>
              {p.title}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      )}
      {ideaList.length > 0 && (
        <NativeSelectOptGroup label="Ideas">
          {ideaList.map((i) => (
            <NativeSelectOption key={i.id} value={`idea:${i.id}`}>
              {i.title}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      )}
    </NativeSelect>
  );
}

function withCurrent(list: TitleRef[] | undefined, current?: TitleRef | null) {
  const items = list ?? [];
  return current && !items.some((i) => i.id === current.id)
    ? [current, ...items]
    : items;
}
