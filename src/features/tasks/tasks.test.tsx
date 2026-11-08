import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { describeProjectActivity } from '@/features/projects/activity-text';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { TaskPanel } from './components/task-panel';
import { TasksView } from './components/tasks-view';
import {
  DEFAULT_TASK_FILTERS,
  taskFiltersFromParams,
  taskFiltersToParams,
} from './filters';
import { formatDue } from './task-styles';
import type { Task, TaskSummary } from './types';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/tasks',
  useSearchParams: () => searchParams,
}));

function summary(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: 't1',
    title: 'Buy seeds',
    status: 'todo',
    priority: 'high',
    startDate: null,
    dueDate: '2020-01-05',
    completedAt: null,
    isOverdue: true,
    project: { id: 'p1', title: 'Garden app' },
    parentTaskId: null,
    subtasks: { completed: 1, total: 2 },
    position: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    ...summary(),
    description: null,
    parent: null,
    subtaskList: [
      {
        id: 's1',
        title: 'Compare prices',
        status: 'done',
        priority: null,
        dueDate: null,
        completedAt: '2026-11-02T10:00:00.000Z',
        isOverdue: false,
        position: 0,
      },
      {
        id: 's2',
        title: 'Order online',
        status: 'todo',
        priority: null,
        dueDate: null,
        completedAt: null,
        isOverdue: false,
        position: 1,
      },
    ],
    ...overrides,
  };
}

const page = (data: TaskSummary[]) =>
  jsonResponse({
    data,
    meta: { page: 1, pageSize: 25, total: data.length, totalPages: 1 },
  });

const projectOptions = {
  'GET /projects?scope=all&sort=title&pageSize=100': () =>
    jsonResponse({
      data: [{ id: 'p1', title: 'Garden app' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    }),
};

const bodyOf = (
  fetchMock: ReturnType<typeof mockApi>,
  method: string,
  path: string,
) =>
  JSON.parse(
    String(
      fetchMock.mock.calls.find(
        ([url, init]) => init?.method === method && String(url).endsWith(path),
      )?.[1]?.body,
    ),
  ) as unknown;

describe('task filters', () => {
  it('leaves defaults out of the URL and ignores unknown values', () => {
    expect(taskFiltersToParams(DEFAULT_TASK_FILTERS).toString()).toBe('');
    expect(
      taskFiltersFromParams(new URLSearchParams('view=later&priority=urgent')),
    ).toEqual({ ...DEFAULT_TASK_FILTERS, priority: 'urgent' });
    expect(
      taskFiltersToParams({
        ...DEFAULT_TASK_FILTERS,
        view: 'overdue',
        projectId: 'none',
      }).toString(),
    ).toBe('view=overdue&projectId=none');
  });
});

describe('formatDue', () => {
  const now = new Date(2026, 10, 8, 23, 30); // 8 Nov 2026, late evening
  it.each([
    ['2026-11-08', 'Today'],
    ['2026-11-09', 'Tomorrow'],
    ['2026-11-07', 'Yesterday'],
    ['2026-12-25', '25 Dec'],
    ['2027-01-03', '3 Jan 2027'],
  ])('%s → %s', (due, expected) => {
    expect(formatDue(due, now)).toBe(expected);
  });
});

describe('project activity for tasks', () => {
  it('describes task completions', () => {
    expect(
      describeProjectActivity({
        id: 'a1',
        action: 'task_completed',
        entityType: 'project',
        entityId: 'p1',
        summary: 'Garden app',
        metadata: { task: 'Buy seeds' },
        createdAt: '2026-11-08T10:00:00.000Z',
      }),
    ).toBe('Completed task "Buy seeds"');
  });
});

describe('TasksView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('lists pending tasks with priority, due date, project and subtasks', async () => {
    mockApi({
      ...projectOptions,
      'GET /tasks?page=1&pageSize=25': () => page([summary()]),
    });
    renderWithProviders(<TasksView />);

    const list = await screen.findByRole('list', { name: 'Pending tasks' });
    expect(within(list).getByText('Buy seeds')).toBeInTheDocument();
    expect(within(list).getByText('Overdue,')).toBeInTheDocument();
    expect(within(list).getByText('5 Jan 2020')).toBeInTheDocument();
    expect(
      within(list).getByRole('link', { name: 'Garden app' }),
    ).toHaveAttribute('href', '/projects/p1');
    expect(within(list).getByText('1/2 subtasks')).toBeInTheDocument();
  });

  it('completes a task with its checkbox', async () => {
    const fetchMock = mockApi({
      ...projectOptions,
      'GET /tasks?page=1&pageSize=25': () => page([summary()]),
      'PATCH /tasks/t1': () => jsonResponse(task({ status: 'done' })),
    });
    renderWithProviders(<TasksView />);

    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'Complete "Buy seeds"' }),
    );
    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PATCH', '/tasks/t1')).toEqual({
        status: 'done',
      }),
    );
  });

  it('switches views through the URL', async () => {
    mockApi({
      ...projectOptions,
      'GET /tasks?page=1&pageSize=25': () => page([]),
    });
    renderWithProviders(<TasksView />);

    await userEvent.click(screen.getByRole('button', { name: 'Overdue' }));
    expect(replace).toHaveBeenCalledWith('/tasks?view=overdue', {
      scroll: false,
    });
  });

  it('shows a friendly message when nothing is overdue', async () => {
    searchParams = new URLSearchParams('view=overdue');
    mockApi({
      ...projectOptions,
      'GET /tasks?view=overdue&page=1&pageSize=25': () => page([]),
    });
    renderWithProviders(<TasksView />);

    expect(await screen.findByText('Nothing overdue')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Overdue', pressed: true }),
    ).toBeInTheDocument();
  });

  it('quick-adds a task with a due date and project', async () => {
    const fetchMock = mockApi({
      ...projectOptions,
      'GET /tasks?page=1&pageSize=25': () => page([]),
      'POST /tasks': () => jsonResponse(task({ title: 'Water plants' }), 201),
    });
    renderWithProviders(<TasksView />);

    await userEvent.type(screen.getByLabelText('New task'), 'Water plants');
    await userEvent.type(
      screen.getByLabelText('Task due date (optional)'),
      '2026-12-01',
    );
    const projectSelect = screen.getByLabelText('Task project (optional)');
    await within(projectSelect).findByRole('option', { name: 'Garden app' });
    await userEvent.selectOptions(projectSelect, 'p1');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'POST', '/tasks')).toEqual({
        title: 'Water plants',
        dueDate: '2026-12-01',
        projectId: 'p1',
      }),
    );
    expect(await screen.findByLabelText('New task')).toHaveValue('');
  });

  it('expands subtasks and adds one', async () => {
    const fetchMock = mockApi({
      ...projectOptions,
      'GET /tasks?page=1&pageSize=25': () => page([summary()]),
      'GET /tasks/t1': () => jsonResponse(task()),
      'POST /tasks': () =>
        jsonResponse(task({ id: 's3', title: 'Pay', parentTaskId: 't1' }), 201),
    });
    renderWithProviders(<TasksView />);

    await userEvent.click(
      await screen.findByRole('button', { name: /1\/2 subtasks/ }),
    );
    const subtasks = await screen.findByRole('list', {
      name: 'Subtasks of Buy seeds',
    });
    expect(
      within(subtasks).getByRole('checkbox', {
        name: 'Reopen "Compare prices"',
      }),
    ).toBeChecked();

    await userEvent.type(screen.getByLabelText('New subtask'), 'Pay{Enter}');
    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'POST', '/tasks')).toEqual({
        title: 'Pay',
        parentTaskId: 't1',
      }),
    );
  });
});

describe('TaskPanel', () => {
  it('refuses a due date before the start date', async () => {
    mockApi({ ...projectOptions, 'GET /tasks/t1': () => jsonResponse(task()) });
    renderWithProviders(<TaskPanel taskId="t1" onClose={vi.fn()} />);

    await userEvent.type(
      await screen.findByLabelText('Start date'),
      '2020-02-01',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText("The due date can't be before the start date"),
    ).toBeInTheDocument();
  });

  it('saves changes', async () => {
    const fetchMock = mockApi({
      ...projectOptions,
      'GET /tasks/t1': () => jsonResponse(task()),
      'PATCH /tasks/t1': () => jsonResponse(task({ status: 'in_progress' })),
    });
    renderWithProviders(<TaskPanel taskId="t1" onClose={vi.fn()} />);

    await userEvent.selectOptions(
      await screen.findByLabelText('Status'),
      'in_progress',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PATCH', '/tasks/t1')).toEqual({
        title: 'Buy seeds',
        description: null,
        status: 'in_progress',
        priority: 'high',
        startDate: null,
        dueDate: '2020-01-05',
        projectId: 'p1',
      }),
    );
  });

  it("doesn't let a subtask move to another project on its own", async () => {
    mockApi({
      ...projectOptions,
      'GET /tasks/s2': () =>
        jsonResponse(
          task({
            id: 's2',
            title: 'Order online',
            parentTaskId: 't1',
            parent: { id: 't1', title: 'Buy seeds' },
            subtaskList: [],
            subtasks: { completed: 0, total: 0 },
          }),
        ),
    });
    renderWithProviders(<TaskPanel taskId="s2" onClose={vi.fn()} />);

    expect(await screen.findByLabelText('Project')).toBeDisabled();
    expect(screen.getByText('Part of "Buy seeds"')).toBeInTheDocument();
  });
});
