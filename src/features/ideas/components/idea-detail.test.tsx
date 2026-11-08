import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import type { Idea } from '../types';
import { IdeaDetailView } from './idea-detail-view';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ id: 'idea-1' }),
}));

const idea: Idea = {
  id: 'idea-1',
  title: 'Plant watering app',
  description: 'Reminds you when to water.',
  status: 'exploring',
  priority: 'high',
  isFavorite: false,
  archivedAt: null,
  category: { id: 'cat-1', name: 'Health', color: 'emerald' },
  tags: [{ id: 't1', name: 'mobile' }],
  links: [{ id: 'l1', url: 'https://example.com/a', label: 'Article' }],
  project: null,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-07T10:00:00.000Z',
};

const lookups = {
  'GET /categories': () =>
    jsonResponse([
      { id: 'cat-1', name: 'Health', color: 'emerald' },
      { id: 'cat-2', name: 'Business', color: 'sky' },
    ]),
  'GET /tags': () => jsonResponse([{ id: 't1', name: 'mobile' }]),
};

const lastBody = (fetchMock: ReturnType<typeof mockApi>, method: string) => {
  const call = fetchMock.mock.calls
    .filter(([, init]) => init?.method === method)
    .at(-1);
  return JSON.parse(String(call?.[1]?.body)) as Record<string, unknown>;
};

describe('Idea page', () => {
  beforeEach(() => push.mockReset());

  it('shows the idea, its links, and a form with the saved values', async () => {
    mockApi({ ...lookups, 'GET /ideas/idea-1': () => jsonResponse(idea) });
    renderWithProviders(<IdeaDetailView />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Plant watering app',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Article/ })).toHaveAttribute(
      'href',
      'https://example.com/a',
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Plant watering app');
    expect(screen.getByLabelText('Status')).toHaveValue('exploring');
    expect(screen.getByLabelText('Priority')).toHaveValue('high');
    expect(await screen.findByLabelText('Category')).toHaveValue('cat-1');
    expect(screen.getByText('#mobile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('saves edits', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /ideas/idea-1': () => jsonResponse(idea),
      'PATCH /ideas/idea-1': () =>
        jsonResponse({ ...idea, title: 'Garden helper' }),
    });
    renderWithProviders(<IdeaDetailView />);

    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Garden helper');
    await userEvent.selectOptions(screen.getByLabelText('Priority'), '');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(lastBody(fetchMock, 'PATCH')).toEqual({
        title: 'Garden helper',
        description: 'Reminds you when to water.',
        status: 'exploring',
        priority: null,
        categoryId: 'cat-1',
        tags: ['mobile'],
        links: [{ url: 'https://example.com/a', label: 'Article' }],
      }),
    );
  });

  it("keeps the idea's category when saving, even if the category list isn't available", async () => {
    // Regression test: an uncontrolled select fell back to "No category" and saving cleared it.
    const fetchMock = mockApi({
      'GET /categories': () => jsonResponse([]),
      'GET /tags': () => jsonResponse([]),
      'GET /ideas/idea-1': () => jsonResponse(idea),
      'PATCH /ideas/idea-1': () => jsonResponse(idea),
    });
    renderWithProviders(<IdeaDetailView />);

    expect(await screen.findByLabelText('Category')).toHaveValue('cat-1');
    await userEvent.type(screen.getByLabelText('Title'), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(lastBody(fetchMock, 'PATCH')).toMatchObject({
        categoryId: 'cat-1',
      }),
    );
  });

  it('checks link addresses before saving', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /ideas/idea-1': () => jsonResponse(idea),
    });
    renderWithProviders(<IdeaDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Add link' }),
    );
    await userEvent.type(
      screen.getByLabelText('Link 2 address'),
      'example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText(
        'Use a full address starting with http:// or https://',
      ),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH'),
    ).toBe(false);
  });

  it('asks before deleting, then goes back to the list', async () => {
    mockApi({
      ...lookups,
      'GET /ideas/idea-1': () => jsonResponse(idea),
      'DELETE /ideas/idea-1': () => new Response(null, { status: 204 }),
    });
    renderWithProviders(<IdeaDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    expect(
      await screen.findByRole('alertdialog', { name: 'Delete this idea?' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/ideas'));
  });

  it('archives, then shows the archived notice and Restore', async () => {
    const archived = { ...idea, archivedAt: '2026-11-07T12:00:00.000Z' };
    mockApi({
      ...lookups,
      'GET /ideas/idea-1': () => jsonResponse(idea),
      'POST /ideas/idea-1/archive': () => jsonResponse(archived),
    });
    renderWithProviders(<IdeaDetailView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Archive' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Restore' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Archived on 7 Nov 2026/)).toBeInTheDocument();
  });

  it('says so when the idea does not exist (or is not yours)', async () => {
    mockApi({
      ...lookups,
      'GET /ideas/idea-1': () =>
        jsonResponse(
          { statusCode: 404, error: 'Not Found', message: 'Idea not found' },
          404,
        ),
    });
    renderWithProviders(<IdeaDetailView />);

    expect(await screen.findByText('Idea not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All ideas' })).toHaveAttribute(
      'href',
      '/ideas',
    );
  });
});
