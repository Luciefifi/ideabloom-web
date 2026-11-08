import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { ProjectDetailView } from './components/project-detail-view';
import type { Milestone, Project } from './types';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ id: 'p1' }),
}));

const ms = (id: string, title: string, done = false): Milestone => ({
  id,
  title,
  description: null,
  dueDate: null,
  completedAt: done ? '2026-11-08T09:00:00.000Z' : null,
  isOverdue: false,
  position: Number(id.slice(1)),
});

function project(overrides: Partial<Project> = {}): Project {
  const milestoneList = overrides.milestoneList ?? [
    ms('m0', 'Design', true),
    ms('m1', 'Build'),
    ms('m2', 'Launch'),
  ];
  const completed = milestoneList.filter((m) => m.completedAt).length;
  return {
    id: 'p1',
    title: 'Garden app',
    status: 'in_progress',
    priority: null,
    category: null,
    startDate: '2026-11-01',
    targetDate: '2026-12-31',
    completedAt: null,
    isOverdue: false,
    progress: {
      percent: Math.round(
        (completed / Math.max(milestoneList.length, 1)) * 100,
      ),
      basis: milestoneList.length ? 'milestones' : 'none',
      completed,
      total: milestoneList.length,
    },
    milestones: { completed, total: milestoneList.length },
    tasks: { completed: 0, total: 0 },
    description: 'A helper for gardeners',
    goals: 'Beta with 20 gardeners',
    sourceIdea: { id: 'i1', title: 'Plant app' },
    relatedIdeas: [
      { id: 'i1', title: 'Plant app', status: 'converted', isArchived: false },
    ],
    milestoneList,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-08T00:00:00.000Z',
    ...overrides,
  };
}

const base = (p: Project = project()) => ({
  'GET /notes?projectId=p1&page=1&pageSize=10': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    }),
  'GET /resources?projectId=p1&page=1&pageSize=10': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    }),
  'GET /projects/p1': () => jsonResponse(p),
  'GET /tasks?projectId=p1&page=1&pageSize=25': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    }),
  'GET /projects/p1/activity?limit=50': () =>
    jsonResponse([
      {
        id: 'a1',
        entityType: 'project',
        entityId: 'p1',
        action: 'milestone_completed',
        summary: 'Garden app',
        metadata: { milestone: 'Design' },
        createdAt: new Date().toISOString(),
      },
    ]),
  'GET /ideas?sort=title&pageSize=100': () =>
    jsonResponse({
      data: [
        { id: 'i1', title: 'Plant app' },
        { id: 'i2', title: 'Seed swap' },
      ],
      meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
    }),
  'GET /categories': () => jsonResponse([]),
});

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

describe('Project page', () => {
  beforeEach(() => push.mockReset());

  it('shows progress, dates, goals, milestones, related ideas and history', async () => {
    mockApi(base());
    renderWithProviders(<ProjectDetailView />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Garden app' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Project progress' }),
    ).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByText('1 of 3 milestones')).toBeInTheDocument();
    expect(screen.getByText('31 Dec 2026')).toBeInTheDocument();
    expect(screen.getByText('Beta with 20 gardeners')).toBeInTheDocument();
    expect(screen.getByLabelText('Design')).toBeChecked();
    expect(screen.getByLabelText('Build')).not.toBeChecked();
    expect(screen.getByText('Started from this idea')).toBeInTheDocument();
    expect(
      await screen.findByText('Completed milestone "Design"'),
    ).toBeInTheDocument();
  });

  it('ticks off a milestone', async () => {
    const fetchMock = mockApi({
      ...base(),
      'PATCH /milestones/m1': () =>
        jsonResponse(
          project({
            milestoneList: [
              ms('m0', 'Design', true),
              ms('m1', 'Build', true),
              ms('m2', 'Launch'),
            ],
          }),
        ),
    });
    renderWithProviders(<ProjectDetailView />);

    await userEvent.click(await screen.findByLabelText('Build'));

    await vi.waitFor(() =>
      expect(screen.getByLabelText('Build')).toBeChecked(),
    );
    expect(bodyOf(fetchMock, 'PATCH', '/milestones/m1')).toEqual({
      completed: true,
    });
    expect(screen.getByText('2 of 3 milestones')).toBeInTheDocument();
  });

  it('adds a milestone with a due date', async () => {
    const fetchMock = mockApi({
      ...base(),
      'POST /projects/p1/milestones': () => jsonResponse(project(), 201),
    });
    renderWithProviders(<ProjectDetailView />);

    await userEvent.type(
      await screen.findByLabelText('Milestone title'),
      'Beta',
    );
    await userEvent.type(
      screen.getByLabelText('Due date (optional)'),
      '2026-12-01',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'POST', '/projects/p1/milestones')).toEqual({
        title: 'Beta',
        dueDate: '2026-12-01',
      }),
    );
  });

  it('moves a milestone down', async () => {
    const fetchMock = mockApi({
      ...base(),
      'PUT /projects/p1/milestones/order': () => jsonResponse(project()),
    });
    renderWithProviders(<ProjectDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Move "Design" down' }),
    );

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PUT', '/projects/p1/milestones/order')).toEqual(
        {
          milestoneIds: ['m1', 'm0', 'm2'],
        },
      ),
    );
    expect(
      screen.getByRole('button', { name: 'Move "Design" up' }),
    ).toBeDisabled();
  });

  it('suggests completing the project when every milestone is done', async () => {
    const allDone = project({
      milestoneList: [ms('m0', 'Design', true), ms('m1', 'Build', true)],
    });
    const fetchMock = mockApi({
      ...base(allDone),
      'PATCH /projects/p1': () =>
        jsonResponse({ ...allDone, status: 'completed' }),
    });
    renderWithProviders(<ProjectDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Mark completed' }),
    );

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PATCH', '/projects/p1')).toEqual({
        status: 'completed',
      }),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Mark completed' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('links another idea', async () => {
    const fetchMock = mockApi({
      ...base(),
      'POST /projects/p1/ideas': () => jsonResponse(project()),
    });
    renderWithProviders(<ProjectDetailView />);

    const select = await screen.findByLabelText('Idea to link');
    await vi.waitFor(() =>
      expect(
        within(select).getByRole('option', { name: 'Seed swap' }),
      ).toBeInTheDocument(),
    );
    // Already-linked ideas aren't offered again.
    expect(
      within(select).queryByRole('option', { name: 'Plant app' }),
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(select, 'i2');
    await userEvent.click(screen.getByRole('button', { name: 'Link idea' }));

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'POST', '/projects/p1/ideas')).toEqual({
        ideaId: 'i2',
      }),
    );
  });

  it('explains what deleting does, then goes back to the list', async () => {
    mockApi({
      ...base(),
      'DELETE /projects/p1': () => new Response(null, { status: 204 }),
    });
    renderWithProviders(<ProjectDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete this project?',
    });
    expect(dialog).toHaveTextContent(
      'its 3 milestones will be deleted permanently',
    );
    expect(dialog).toHaveTextContent('"Plant app" goes back to Planned');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete permanently' }),
    );

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/projects'));
  });

  it('says so when the project does not exist (or is not yours)', async () => {
    mockApi({
      ...base(),
      'GET /projects/p1': () =>
        jsonResponse(
          { statusCode: 404, error: 'Not Found', message: 'Project not found' },
          404,
        ),
    });
    renderWithProviders(<ProjectDetailView />);

    expect(await screen.findByText('Project not found')).toBeInTheDocument();
  });
});
