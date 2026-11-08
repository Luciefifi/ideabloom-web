import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { NewProjectSheet } from './components/new-project-sheet';
import { ProjectsView } from './components/projects-view';
import {
  DEFAULT_PROJECT_FILTERS,
  projectFiltersFromParams,
  projectFiltersToApiParams,
} from './filters';
import { formatDay } from './project-styles';
import type { ProjectSummary } from './types';

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  usePathname: () => '/projects',
  useSearchParams: () => searchParams,
}));

function project(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'p1',
    title: 'Garden app',
    status: 'in_progress',
    priority: 'high',
    category: { id: 'c1', name: 'Health', color: 'emerald' },
    startDate: '2026-11-01',
    targetDate: '2026-12-31',
    completedAt: null,
    isOverdue: false,
    progress: { percent: 60, basis: 'milestones', completed: 3, total: 5 },
    milestones: { completed: 3, total: 5 },
    tasks: { completed: 0, total: 0 },
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-07T00:00:00.000Z',
    ...overrides,
  };
}

const page = (data: ProjectSummary[]) =>
  jsonResponse({
    data,
    meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 },
  });
const categories = { 'GET /categories': () => jsonResponse([]) };

describe('project filters', () => {
  it('"All projects" becomes scope=all for the API', () => {
    const filters = projectFiltersFromParams(new URLSearchParams('status=all'));
    expect(projectFiltersToApiParams(filters).toString()).toBe('scope=all');
  });

  it('the default (active) sends nothing extra', () => {
    expect(projectFiltersToApiParams(DEFAULT_PROJECT_FILTERS).toString()).toBe(
      '',
    );
  });
});

describe('formatDay', () => {
  it('shows the calendar day as stored, with no time-zone shift', () => {
    expect(formatDay('2026-12-31')).toBe('31 Dec 2026');
    expect(formatDay('2026-01-01')).toBe('1 Jan 2026');
  });
});

describe('ProjectsView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('shows projects with status, progress bar and target date', async () => {
    mockApi({
      ...categories,
      'GET /projects?page=1&pageSize=20': () => page([project()]),
    });
    renderWithProviders(<ProjectsView />);

    const card = await screen.findByRole('article', { name: 'Garden app' });
    expect(within(card).getByText('In progress')).toBeInTheDocument();
    expect(
      within(card).getByRole('progressbar', { name: 'Progress of Garden app' }),
    ).toHaveAttribute('aria-valuenow', '60');
    expect(within(card).getByText('3 of 5 milestones')).toBeInTheDocument();
    expect(within(card).getByText(/Due 31 Dec 2026/)).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Garden app' }),
    ).toHaveAttribute('href', '/projects/p1');
  });

  it('highlights overdue projects', async () => {
    mockApi({
      ...categories,
      'GET /projects?page=1&pageSize=20': () =>
        page([project({ isOverdue: true, targetDate: '2026-11-01' })]),
    });
    renderWithProviders(<ProjectsView />);

    expect(
      await screen.findByText(/Overdue · was due 1 Nov 2026/),
    ).toBeInTheDocument();
  });

  it('asks the API for all projects when "All projects" is chosen', async () => {
    searchParams = new URLSearchParams('status=all');
    const fetchMock = mockApi({
      ...categories,
      'GET /projects?scope=all&page=1&pageSize=20': () => page([project()]),
    });
    renderWithProviders(<ProjectsView />);

    await screen.findByRole('article');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects?scope=all&page=1&pageSize=20',
      expect.anything(),
    );
  });

  it('puts the chosen sort in the URL', async () => {
    mockApi({
      ...categories,
      'GET /projects?page=1&pageSize=20': () => page([project()]),
    });
    renderWithProviders(<ProjectsView />);
    await screen.findByRole('article');

    await userEvent.selectOptions(
      screen.getByLabelText('Sort by'),
      'targetDate',
    );

    expect(replace).toHaveBeenCalledWith('/projects?sort=targetDate', {
      scroll: false,
    });
  });

  it('suggests converting an idea when there are no projects', async () => {
    mockApi({
      ...categories,
      'GET /projects?page=1&pageSize=20': () => page([]),
    });
    renderWithProviders(<ProjectsView />);

    expect(await screen.findByText('No active projects')).toBeInTheDocument();
    expect(screen.getByText(/Convert to project/)).toBeInTheDocument();
  });
});

describe('NewProjectSheet', () => {
  beforeEach(() => push.mockReset());

  it('refuses a target date before the start date', async () => {
    const fetchMock = mockApi(categories);
    renderWithProviders(<NewProjectSheet />);

    await userEvent.click(screen.getByRole('button', { name: 'New project' }));
    await userEvent.type(await screen.findByLabelText('Title'), 'Backwards');
    await userEvent.type(screen.getByLabelText('Start date'), '2026-12-31');
    await userEvent.type(screen.getByLabelText('Target date'), '2026-01-01');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create project' }),
    );

    expect(
      await screen.findByText("The target date can't be before the start date"),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'POST'),
    ).toBe(false);
  });

  it('creates the project and opens it', async () => {
    const fetchMock = mockApi({
      ...categories,
      'POST /projects': () =>
        jsonResponse({ ...project(), id: 'new', title: 'Podcast' }, 201),
    });
    renderWithProviders(<NewProjectSheet />);

    await userEvent.click(screen.getByRole('button', { name: 'New project' }));
    await userEvent.type(await screen.findByLabelText('Title'), 'Podcast');
    await userEvent.type(screen.getByLabelText('Goals'), '10 episodes');
    await userEvent.type(screen.getByLabelText('Target date'), '2026-12-31');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create project' }),
    );

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/projects/new'));
    const body = JSON.parse(
      String(
        fetchMock.mock.calls.find(([, i]) => i?.method === 'POST')?.[1]?.body,
      ),
    ) as unknown;
    expect(body).toEqual({
      title: 'Podcast',
      description: null,
      goals: '10 episodes',
      status: 'not_started',
      priority: null,
      categoryId: null,
      startDate: null,
      targetDate: '2026-12-31',
    });
  });
});
