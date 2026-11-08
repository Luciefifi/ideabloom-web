import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { ResourcesView } from './components/resources-view';
import { guessResourceType } from './resource-styles';
import type { Resource } from './types';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/resources',
  useSearchParams: () => searchParams,
}));

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r1',
    title: 'Calm design talk',
    url: 'https://www.youtube.com/watch?v=abc',
    domain: 'youtube.com',
    type: 'video',
    description: 'How whitespace helps',
    notes: null,
    category: null,
    tags: [{ id: 't1', name: 'design' }],
    idea: null,
    project: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

const page = (data: Resource[]) =>
  jsonResponse({
    data,
    meta: { page: 1, pageSize: 25, total: data.length, totalPages: 1 },
  });

const lookups = {
  'GET /categories': () => jsonResponse([]),
  'GET /tags': () => jsonResponse([]),
  'GET /ideas?sort=title&pageSize=100': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
    }),
  'GET /projects?scope=all&sort=title&pageSize=100': () =>
    jsonResponse({
      data: [],
      meta: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
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

describe('guessResourceType', () => {
  it.each([
    ['https://www.youtube.com/watch?v=1', 'video'],
    ['https://youtu.be/abc', 'video'],
    ['https://example.com/report.pdf', 'document'],
    ['https://example.com/blog', null],
    ['not a url', null],
  ])('%s → %s', (url, expected) => {
    expect(guessResourceType(url)).toBe(expected);
  });
});

describe('ResourcesView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('lists resources; links open safely in a new tab', async () => {
    mockApi({
      ...lookups,
      'GET /resources?page=1&pageSize=25': () => page([resource()]),
    });
    renderWithProviders(<ResourcesView />);

    const list = await screen.findByRole('list', { name: 'Resources' });
    expect(within(list).getByText('Video:')).toBeInTheDocument();
    const link = within(list).getByRole('link', { name: /youtube\.com/ });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('filters by type through the URL', async () => {
    mockApi({
      ...lookups,
      'GET /resources?page=1&pageSize=25': () => page([]),
    });
    renderWithProviders(<ResourcesView />);

    await userEvent.selectOptions(screen.getByLabelText('Type'), 'article');
    expect(replace).toHaveBeenCalledWith('/resources?type=article', {
      scroll: false,
    });
  });

  it('adds a resource, suggesting the type from the link', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /resources?page=1&pageSize=25': () => page([]),
      'POST /resources': () => jsonResponse(resource(), 201),
    });
    renderWithProviders(<ResourcesView />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Add resource' }))[0],
    );
    const panel = await screen.findByRole('dialog');
    await userEvent.type(
      within(panel).getByLabelText('Link'),
      'https://youtu.be/abc',
    );
    expect(within(panel).getByLabelText('Type')).toHaveValue('video');
    await userEvent.type(
      within(panel).getByLabelText('Title'),
      'Calm design talk',
    );
    await userEvent.click(
      within(panel).getByRole('button', { name: 'Save resource' }),
    );

    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'POST', '/resources')).toEqual({
        title: 'Calm design talk',
        url: 'https://youtu.be/abc',
        type: 'video',
        description: null,
        notes: null,
        categoryId: null,
        tags: [],
        ideaId: null,
        projectId: null,
      }),
    );
  });

  it('refuses links that are not web addresses', async () => {
    mockApi({
      ...lookups,
      'GET /resources?page=1&pageSize=25': () => page([]),
    });
    renderWithProviders(<ResourcesView />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Add resource' }))[0],
    );
    await userEvent.type(
      await screen.findByLabelText('Link'),
      'javascript:alert(1)',
    );
    await userEvent.type(screen.getByLabelText('Title'), 'x');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save resource' }),
    );

    expect(
      await screen.findByText(
        'Enter a full web address starting with https://',
      ),
    ).toBeInTheDocument();
  });
});
