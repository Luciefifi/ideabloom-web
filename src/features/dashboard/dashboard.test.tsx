import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityEntry } from '@/features/projects/types';
import {
  jsonResponse,
  mockApi,
  renderWithProviders,
  testUser,
} from '@/test/render';
import { describeActivity } from './activity-text';
import { DashboardView } from './components/dashboard-view';
import type { Dashboard } from './types';

// The chart needs real screen measurements; the cards' text versions are tested instead.
vi.mock('./components/dashboard-charts', () => ({
  BarsChart: () => <div data-testid="chart" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const empty: Dashboard = {
  today: '2026-11-08',
  upcomingUntil: '2026-11-21',
  ideas: {
    active: 0,
    byStatus: { inbox: 0, exploring: 0, planned: 0, converted: 0 },
  },
  projects: { active: 0, completed: 0 },
  tasks: { pending: 0, overdue: 0, dueToday: 0 },
  deadlines: { overdue: [], upcoming: [] },
  activeProjects: [],
  completedPerWeek: [
    '2026-09-14',
    '2026-09-21',
    '2026-09-28',
    '2026-10-05',
    '2026-10-12',
    '2026-10-19',
    '2026-10-26',
    '2026-11-02',
  ].map((weekStart) => ({ weekStart, count: 0 })),
};

const full: Dashboard = {
  ...empty,
  ideas: {
    active: 6,
    byStatus: { inbox: 3, exploring: 2, planned: 1, converted: 1 },
  },
  projects: { active: 4, completed: 0 },
  tasks: { pending: 11, overdue: 2, dueToday: 1 },
  deadlines: {
    overdue: [
      {
        kind: 'task',
        id: 't1',
        title: 'Renew passport',
        date: '2026-11-07',
        project: null,
      },
    ],
    upcoming: [
      {
        kind: 'task',
        id: 't2',
        title: 'Collect my 5 favourite projects',
        date: '2026-11-08',
        project: { id: 'p2', title: 'Personal portfolio v2' },
      },
      {
        kind: 'milestone',
        id: 'm1',
        title: 'API ready',
        date: '2026-11-13',
        project: { id: 'p1', title: 'Garden booking app' },
      },
    ],
  },
  activeProjects: [
    {
      id: 'p1',
      title: 'Garden booking app',
      status: 'in_progress',
      priority: 'high',
      category: null,
      startDate: null,
      targetDate: null,
      completedAt: null,
      isOverdue: false,
      progress: { percent: 50, basis: 'tasks', completed: 3, total: 6 },
      milestones: { completed: 1, total: 3 },
      tasks: { completed: 3, total: 6 },
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-11-08T10:00:00.000Z',
    },
  ],
  completedPerWeek: empty.completedPerWeek.map((w, i) => ({
    ...w,
    count: i === 7 ? 3 : 1,
  })),
};

const activity: ActivityEntry[] = [
  {
    id: 'a1',
    entityType: 'project',
    entityId: 'p1',
    action: 'task_completed',
    summary: 'Garden booking app',
    metadata: { task: 'Month view' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    entityType: 'idea',
    entityId: 'i1',
    action: 'created',
    summary: 'Weekly meal planner',
    metadata: {},
    createdAt: new Date().toISOString(),
  },
];

const routes = (dashboard: Dashboard, withData = true) => ({
  'GET /users/me': () => jsonResponse({ ...testUser, displayName: 'Lavender' }),
  'GET /dashboard': () => jsonResponse(dashboard),
  'GET /activity?limit=10': () => jsonResponse(withData ? activity : []),
  'GET /ideas?sort=createdAt&pageSize=5': () =>
    jsonResponse({
      data: withData
        ? [
            {
              id: 'i1',
              title: 'Weekly meal planner',
              status: 'inbox',
              priority: null,
              isFavorite: false,
              archivedAt: null,
              category: null,
              tags: [],
              excerpt: null,
              linkCount: 0,
              createdAt: '2026-11-08T10:00:00.000Z',
              updatedAt: '2026-11-08T10:00:00.000Z',
            },
          ]
        : [],
      meta: { page: 1, pageSize: 5, total: withData ? 1 : 0, totalPages: 1 },
    }),
  'GET /projects?scope=all&sort=title&pageSize=100': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
    }),
});

describe('describeActivity', () => {
  it('describes entries from every part of the app, with links', () => {
    expect(describeActivity(activity[0])).toEqual({
      text: 'Completed task "Month view"',
      context: 'Garden booking app',
      href: '/projects/p1',
    });
    expect(describeActivity(activity[1])).toEqual({
      text: 'Captured idea "Weekly meal planner"',
      href: '/ideas/i1',
    });
    expect(
      describeActivity({
        ...activity[1],
        entityType: 'task',
        action: 'status_changed',
        summary: 'Buy seeds',
        metadata: { from: 'todo', to: 'in_progress' },
      }).text,
    ).toBe('Moved task "Buy seeds" from To do to In progress');
    expect(
      describeActivity({
        ...activity[1],
        entityType: 'note',
        action: 'deleted',
      }),
    ).toEqual({ text: 'Deleted note "Weekly meal planner"' }); // no link to a deleted item
  });
});

describe('DashboardView', () => {
  it('greets you and shows the day in your time zone', async () => {
    mockApi(routes(full));
    renderWithProviders(<DashboardView />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /, Lavender$/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Sunday 8 November 2026'),
    ).toBeInTheDocument();
  });

  it('shows the numbers at a glance, linking to each list', async () => {
    mockApi(routes(full));
    renderWithProviders(<DashboardView />);

    const glance = await screen.findByRole('navigation', {
      name: 'At a glance',
    });
    const overdue = within(glance).getByRole('link', { name: /Overdue tasks/ });
    expect(overdue).toHaveAttribute('href', '/tasks?view=overdue');
    expect(overdue).toHaveTextContent('2');
    expect(
      within(glance).getByRole('link', { name: /Pending tasks · 1 due today/ }),
    ).toHaveTextContent('11');
  });

  it('lists overdue deadlines first, then upcoming ones with friendly dates', async () => {
    mockApi(routes(full));
    renderWithProviders(<DashboardView />);

    const card = await screen.findByRole('region', { name: 'Deadlines' });
    const links = within(card).getAllByRole('link').slice(1); // skip "All tasks"
    expect(links.map((l) => l.textContent)).toEqual([
      'Task: Renew passportYesterday',
      'Task: Collect my 5 favourite projectsPersonal portfolio v2Today',
      'Milestone: API readyGarden booking app13 Nov',
    ]);
    expect(links[2]).toHaveAttribute('href', '/projects/p1');
  });

  it('shows projects, charts as text, activity and recent ideas', async () => {
    mockApi(routes(full));
    renderWithProviders(<DashboardView />);

    const projects = await screen.findByRole('region', {
      name: 'Projects in progress',
    });
    expect(within(projects).getByText('3 of 6 tasks')).toBeInTheDocument();

    const ideas = screen.getByRole('region', { name: 'Ideas by status' });
    expect(within(ideas).getByText('Inbox: 3')).toBeInTheDocument();

    const tasks = screen.getByRole('region', { name: 'Tasks completed' });
    expect(
      within(tasks).getByText('3 this week · 10 in the last 8 weeks'),
    ).toBeInTheDocument();
    expect(within(tasks).getByRole('table')).toHaveTextContent('2 Nov3');

    const feed = screen.getByRole('region', { name: 'Recent activity' });
    expect(
      await within(feed).findByRole('link', {
        name: /Completed task "Month view"/,
      }),
    ).toHaveAttribute('href', '/projects/p1');

    const recent = screen.getByRole('region', { name: 'Recently added ideas' });
    expect(
      await within(recent).findByRole('link', { name: /Weekly meal planner/ }),
    ).toHaveAttribute('href', '/ideas/i1');
  });

  it('is friendly for a brand-new account', async () => {
    mockApi(routes(empty, false));
    renderWithProviders(<DashboardView />);

    expect(
      await screen.findByText('Nothing due in the next 14 days. 🎉'),
    ).toBeInTheDocument();
    expect(screen.getByText(/No active projects/)).toBeInTheDocument();
    expect(screen.getByText('No ideas yet.')).toBeInTheDocument();
    expect(
      await screen.findByText('No ideas yet. Capture one above.'),
    ).toBeInTheDocument();
    // Quick capture is always there.
    expect(screen.getByLabelText('Capture a new idea')).toBeInTheDocument();
    expect(screen.getByLabelText('New task')).toBeInTheDocument();
  });

  it('offers "Try again" when the summary fails to load', async () => {
    mockApi({
      ...routes(empty, false),
      'GET /dashboard': () =>
        jsonResponse(
          { statusCode: 500, message: 'Internal server error' },
          500,
        ),
    });
    renderWithProviders(<DashboardView />);

    expect(
      await screen.findByRole(
        'button',
        { name: 'Try again' },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
  });
});
