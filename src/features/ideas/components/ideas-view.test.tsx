import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import type { IdeaPage, IdeaSummary } from '../types';
import { IdeasView } from './ideas-view';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/ideas',
  useSearchParams: () => searchParams,
}));

function idea(overrides: Partial<IdeaSummary> = {}): IdeaSummary {
  return {
    id: 'idea-1',
    title: 'Plant watering app',
    excerpt: 'Reminds you when to water',
    status: 'exploring',
    priority: 'high',
    isFavorite: false,
    archivedAt: null,
    category: { id: 'cat-1', name: 'Health', color: 'emerald' },
    tags: [{ id: 'tag-1', name: 'mobile' }],
    linkCount: 2,
    createdAt: '2026-11-07T10:00:00.000Z',
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    ...overrides,
  };
}

function page(
  data: IdeaSummary[],
  pageNumber = 1,
  totalPages = 1,
  total = data.length,
): IdeaPage {
  return { data, meta: { page: pageNumber, pageSize: 20, total, totalPages } };
}

const lookups = {
  'GET /categories': () =>
    jsonResponse([{ id: 'cat-1', name: 'Health', color: 'emerald' }]),
  'GET /tags': () => jsonResponse([{ id: 'tag-1', name: 'mobile' }]),
};

describe('IdeasView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('shows ideas with their status, category, priority, tags and update time', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () => jsonResponse(page([idea()])),
    });
    renderWithProviders(<IdeasView />);

    const card = await screen.findByRole('article', {
      name: 'Plant watering app',
    });
    expect(within(card).getByText('Exploring')).toBeInTheDocument();
    expect(within(card).getByText('Health')).toBeInTheDocument();
    expect(within(card).getByText('High')).toBeInTheDocument();
    expect(within(card).getByText('#mobile')).toBeInTheDocument();
    expect(within(card).getByText('2 links')).toBeInTheDocument();
    expect(
      within(card).getByText('Updated about 2 hours ago'),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Plant watering app' }),
    ).toHaveAttribute('href', '/ideas/idea-1');
    expect(screen.getByText('1 idea')).toBeInTheDocument();
  });

  it('invites a first idea when there are none', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () => jsonResponse(page([])),
    });
    renderWithProviders(<IdeasView />);

    expect(await screen.findByText('No ideas yet')).toBeInTheDocument();
  });

  it('explains when filters match nothing, and clears them', async () => {
    searchParams = new URLSearchParams('status=planned');
    mockApi({
      ...lookups,
      'GET /ideas?status=planned&page=1&pageSize=20': () =>
        jsonResponse(page([])),
    });
    renderWithProviders(<IdeasView />);

    expect(
      await screen.findByText('No ideas match these filters'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole('button', { name: /clear filters/i })[0],
    );

    expect(replace).toHaveBeenCalledWith('/ideas', { scroll: false });
  });

  it('puts a chosen filter in the URL', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () => jsonResponse(page([idea()])),
    });
    renderWithProviders(<IdeasView />);
    await screen.findByRole('article');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'planned');

    expect(replace).toHaveBeenCalledWith('/ideas?status=planned', {
      scroll: false,
    });
  });

  it('searches once typing pauses', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () => jsonResponse(page([idea()])),
    });
    renderWithProviders(<IdeasView />);
    await screen.findByRole('article');

    await userEvent.type(screen.getByLabelText('Search ideas'), 'plant');

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/ideas?search=plant', {
        scroll: false,
      }),
    );
    // One URL update for the whole word, not one per keystroke.
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('loads more ideas page by page', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () =>
        jsonResponse(page([idea({ id: 'a', title: 'First' })], 1, 2, 2)),
      'GET /ideas?page=2&pageSize=20': () =>
        jsonResponse(page([idea({ id: 'b', title: 'Second' })], 2, 2, 2)),
    });
    renderWithProviders(<IdeasView />);

    await screen.findByRole('article', { name: 'First' });
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(
      await screen.findByRole('article', { name: 'Second' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'First' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument();
  });

  it('stars an idea instantly and undoes it if saving fails', async () => {
    let fail = true;
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () => jsonResponse(page([idea()])),
      'PATCH /ideas/idea-1': () =>
        fail
          ? jsonResponse(
              { statusCode: 500, error: 'Error', message: 'Boom' },
              500,
            )
          : jsonResponse({ ...idea(), isFavorite: true }),
    });
    renderWithProviders(<IdeasView />);

    const star = await screen.findByRole('button', {
      name: 'Add "Plant watering app" to favourites',
    });
    await userEvent.click(star);

    // Back to not-starred after the failure.
    await vi.waitFor(() =>
      expect(star).toHaveAttribute('aria-pressed', 'false'),
    );
    fail = false;
  });

  it('shows an error with a retry button when loading fails', async () => {
    mockApi({
      ...lookups,
      'GET /ideas?page=1&pageSize=20': () =>
        jsonResponse(
          { statusCode: 500, error: 'Error', message: 'Database is down' },
          500,
        ),
    });
    renderWithProviders(<IdeasView />);

    expect(await screen.findByText('Database is down')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });
});
