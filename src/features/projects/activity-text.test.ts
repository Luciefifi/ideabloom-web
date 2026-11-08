import { describe, expect, it } from 'vitest';
import { describeProjectActivity } from './activity-text';
import type { ActivityEntry } from './types';

const entry = (
  action: string,
  metadata: ActivityEntry['metadata'] = {},
): ActivityEntry => ({
  id: '1',
  entityType: 'project',
  entityId: 'p1',
  action,
  summary: 'Garden app',
  metadata,
  createdAt: '2026-11-08T10:00:00.000Z',
});

describe('describeProjectActivity', () => {
  it.each([
    [entry('created'), 'Created the project'],
    [
      entry('created', { fromIdea: 'Plant app' }),
      'Created from the idea "Plant app"',
    ],
    [
      entry('status_changed', { from: 'planning', to: 'in_progress' }),
      'Changed status from Planning to In progress',
    ],
    [
      entry('milestone_completed', { milestone: 'Beta' }),
      'Completed milestone "Beta"',
    ],
    [
      entry('milestone_reopened', { milestone: 'Beta' }),
      'Reopened milestone "Beta"',
    ],
    [entry('idea_linked', { idea: 'Logo' }), 'Linked the idea "Logo"'],
    [entry('updated'), 'Edited the project details'],
    [entry('something_new'), 'something new'],
  ])('%#: %s', (input, expected) => {
    expect(describeProjectActivity(input)).toBe(expected);
  });
});
