import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdeaDetailView } from '@/features/ideas/components/idea-detail-view';
import type { Idea } from '@/features/ideas/types';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ id: 'idea-1' }),
}));

const idea: Idea = {
  id: 'idea-1',
  title: 'Plant app',
  description: null,
  status: 'planned',
  priority: null,
  isFavorite: false,
  archivedAt: null,
  category: null,
  tags: [],
  links: [],
  project: null,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-07T10:00:00.000Z',
};

const lookups = {
  'GET /categories': () => jsonResponse([]),
  'GET /tags': () => jsonResponse([]),
};

describe('Convert to project', () => {
  beforeEach(() => push.mockReset());

  it('turns the idea into a project and opens it', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /ideas/idea-1': () => jsonResponse(idea),
      'POST /ideas/idea-1/convert': () =>
        jsonResponse({ id: 'proj-1', title: 'Plant app v1' }, 201),
    });
    renderWithProviders(<IdeaDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Convert to project' }),
    );
    const title = await screen.findByLabelText('Project title');
    expect(title).toHaveValue('Plant app'); // prefilled from the idea
    await userEvent.clear(title);
    await userEvent.type(title, 'Plant app v1');
    await userEvent.type(screen.getByLabelText('Target date'), '2026-12-31');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create project' }),
    );

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/projects/proj-1'),
    );
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/convert'),
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      title: 'Plant app v1',
      startDate: null,
      targetDate: '2026-12-31',
    });
  });

  it('shows "Open project" instead for an idea that is already a project', async () => {
    mockApi({
      ...lookups,
      'GET /ideas/idea-1': () =>
        jsonResponse({
          ...idea,
          status: 'converted',
          project: { id: 'proj-1', title: 'Plant app' },
        }),
    });
    renderWithProviders(<IdeaDetailView />);

    expect(
      await screen.findByRole('link', { name: 'Open project' }),
    ).toHaveAttribute('href', '/projects/proj-1');
    expect(
      screen.queryByRole('button', { name: 'Convert to project' }),
    ).not.toBeInTheDocument();
  });
});
