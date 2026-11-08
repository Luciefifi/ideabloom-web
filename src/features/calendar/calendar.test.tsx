import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { monthGrid, parseMonth, shiftMonth } from './calendar-dates';
import { CalendarView } from './components/calendar-view';
import type { CalendarEvent } from './types';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/calendar',
  useSearchParams: () => searchParams,
}));

describe('calendar dates', () => {
  it('shows whole weeks, Monday to Sunday', () => {
    const grid = monthGrid('2026-11');
    expect(grid.from).toBe('2026-10-26'); // the Monday before 1 Nov (a Sunday)
    expect(grid.to).toBe('2026-12-06');
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks[0][6]).toBe('2026-11-01');
  });

  it('moves between months and checks the URL value', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(parseMonth('2026-11')).toBe('2026-11');
    expect(parseMonth('2026-13')).toBeNull();
    expect(parseMonth('nonsense')).toBeNull();
  });
});

const event = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  kind: 'task',
  id: 't1',
  title: 'Renew passport',
  date: '2026-11-07',
  done: false,
  overdue: true,
  project: null,
  parent: null,
  ...overrides,
});

const november = {
  from: '2026-10-26',
  to: '2026-12-06',
  today: '2026-11-08',
  events: [
    event({}),
    event({
      id: 't2',
      title: 'Month view',
      date: '2026-11-09',
      overdue: false,
      done: true,
      parent: { id: 't9', title: 'Calendar component' },
      project: { id: 'p1', title: 'Garden app' },
    }),
    event({
      kind: 'milestone',
      id: 'm1',
      title: 'API ready',
      date: '2026-11-13',
      overdue: false,
      project: { id: 'p1', title: 'Garden app' },
    }),
  ],
};

describe('CalendarView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams('month=2026-11');
  });

  it('places items on their days, marking today, overdue and done', async () => {
    mockApi({
      'GET /calendar?from=2026-10-26&to=2026-12-06': () =>
        jsonResponse(november),
    });
    renderWithProviders(<CalendarView />);

    const grid = await screen.findByRole('table', { name: /November 2026/ });
    const cell = (label: string) =>
      within(grid).getByText(label).closest('td') as HTMLElement;

    expect(cell('Sunday 8 November')).toHaveAttribute('aria-current', 'date');
    expect(
      within(cell('Saturday 7 November')).getByRole('button', {
        name: 'Task: Renew passport (overdue)',
      }),
    ).toBeInTheDocument();
    expect(
      within(cell('Monday 9 November')).getByRole('button', {
        name: 'Task: Month view, part of Calendar component (done)',
      }),
    ).toBeInTheDocument();
    expect(
      within(cell('Friday 13 November')).getByRole('link', {
        name: 'Milestone: API ready',
      }),
    ).toHaveAttribute('href', '/projects/p1');
  });

  it('moves to the next month through the URL', async () => {
    mockApi({
      'GET /calendar?from=2026-10-26&to=2026-12-06': () =>
        jsonResponse(november),
    });
    renderWithProviders(<CalendarView />);

    expect(
      await screen.findByRole('heading', { name: 'November 2026' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(replace).toHaveBeenCalledWith('/calendar?month=2026-12', {
      scroll: false,
    });
  });

  it('opens a task in the side panel', async () => {
    mockApi({
      'GET /calendar?from=2026-10-26&to=2026-12-06': () =>
        jsonResponse(november),
      'GET /tasks/t1': () =>
        jsonResponse({
          ...event({}),
          status: 'todo',
          priority: 'urgent',
          startDate: null,
          dueDate: '2026-11-07',
          completedAt: null,
          isOverdue: true,
          parentTaskId: null,
          subtasks: { completed: 0, total: 0 },
          position: 0,
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
          description: null,
          subtaskList: [],
        }),
      'GET /projects?scope=all&sort=title&pageSize=100': () =>
        jsonResponse({
          data: [],
          meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
        }),
    });
    renderWithProviders(<CalendarView />);

    const grid = await screen.findByRole('table', { name: /November 2026/ });
    await userEvent.click(
      within(grid).getByRole('button', { name: /Renew passport/ }),
    );
    expect(await screen.findByLabelText('Title')).toHaveValue('Renew passport');
  });
});
