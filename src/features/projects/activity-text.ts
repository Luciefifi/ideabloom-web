import { PROJECT_STATUS_LABELS } from './project-styles';
import type { ActivityEntry, ProjectStatus } from './types';

const statusLabel = (value: unknown) =>
  PROJECT_STATUS_LABELS[value as ProjectStatus] ?? String(value);

/** One readable sentence per history entry, e.g. 'Completed milestone "Beta"'. */
export function describeProjectActivity(entry: ActivityEntry): string {
  const m = entry.metadata;
  switch (entry.action) {
    case 'created':
      return m.fromIdea
        ? `Created from the idea "${String(m.fromIdea)}"`
        : 'Created the project';
    case 'updated':
      return 'Edited the project details';
    case 'status_changed':
      return `Changed status from ${statusLabel(m.from)} to ${statusLabel(m.to)}`;
    case 'milestone_added':
      return `Added milestone "${String(m.milestone)}"`;
    case 'milestone_completed':
      return `Completed milestone "${String(m.milestone)}"`;
    case 'milestone_reopened':
      return `Reopened milestone "${String(m.milestone)}"`;
    case 'milestone_deleted':
      return `Deleted milestone "${String(m.milestone)}"`;
    case 'idea_linked':
      return `Linked the idea "${String(m.idea)}"`;
    case 'idea_unlinked':
      return `Unlinked the idea "${String(m.idea)}"`;
    default:
      return entry.action.replaceAll('_', ' ');
  }
}
