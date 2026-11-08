import { STATUS_LABELS } from '@/features/ideas/idea-styles';
import type { IdeaStatus } from '@/features/ideas/types';
import { describeProjectActivity } from '@/features/projects/activity-text';
import type { ActivityEntry } from '@/features/projects/types';
import { TASK_STATUS_LABELS } from '@/features/tasks/task-styles';
import type { TaskStatus } from '@/features/tasks/types';

export interface ActivityLine {
  /** e.g. 'Completed task "Buy seeds"' */
  text: string;
  /** For project entries: the project's title. */
  context?: string;
  /** Where to open it (none for deleted items). */
  href?: string;
}

const HREF: Record<ActivityEntry['entityType'], (id: string) => string> = {
  idea: (id) => `/ideas/${id}`,
  project: (id) => `/projects/${id}`,
  task: () => '/tasks',
  note: (id) => `/notes/${id}`,
  resource: () => '/resources',
};

const NOUN: Record<ActivityEntry['entityType'], string> = {
  idea: 'idea',
  project: 'project',
  task: 'task',
  note: 'note',
  resource: 'resource',
};

function statusLabel(type: ActivityEntry['entityType'], value: unknown) {
  if (type === 'idea')
    return STATUS_LABELS[value as IdeaStatus] ?? String(value);
  if (type === 'task') {
    return TASK_STATUS_LABELS[value as TaskStatus] ?? String(value);
  }
  return String(value);
}

/** One readable line for the dashboard's "Recent activity". */
export function describeActivity(entry: ActivityEntry): ActivityLine {
  const href =
    entry.action === 'deleted'
      ? undefined
      : HREF[entry.entityType](entry.entityId);

  if (entry.entityType === 'project') {
    return {
      text: describeProjectActivity(entry),
      context: entry.summary,
      href,
    };
  }

  const noun = NOUN[entry.entityType];
  const name = `${noun} "${entry.summary}"`;
  const m = entry.metadata;
  const text = (() => {
    switch (entry.action) {
      case 'created':
        return entry.entityType === 'idea'
          ? `Captured ${name}`
          : entry.entityType === 'resource'
            ? `Saved ${name}`
            : `Added ${name}`;
      case 'updated':
        return `Edited ${name}`;
      case 'deleted':
        return `Deleted ${name}`;
      case 'completed':
        return `Completed ${name}`;
      case 'reopened':
        return `Reopened ${name}`;
      case 'status_changed':
        return `Moved ${name} from ${statusLabel(entry.entityType, m.from)} to ${statusLabel(entry.entityType, m.to)}`;
      case 'favorited':
        return `Added ${name} to favourites`;
      case 'unfavorited':
        return `Removed ${name} from favourites`;
      case 'archived':
        return `Archived ${name}`;
      case 'restored':
        return `Restored ${name}`;
      case 'converted':
        return `Turned ${name} into a project`;
      default:
        return `${entry.action.replaceAll('_', ' ')}: ${entry.summary}`;
    }
  })();
  return { text, href };
}
