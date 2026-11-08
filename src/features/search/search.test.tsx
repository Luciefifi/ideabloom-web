import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { SearchDialog } from './components/search-dialog';
import { SearchView } from './components/search-view';
import { Highlighted, plainText } from './highlight';
import { resultHref } from './search-styles';
import type { SearchResponse } from './types';
import { HIGHLIGHT_END as E, HIGHLIGHT_START as S } from './types';

const push = vi.fn();
const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/search',
  useSearchParams: () => searchParams,
}));

const results: SearchResponse = {
  query: 'gard',
  groups: [
    {
      type: 'idea',
      total: 1,
      items: [
        {
          type: 'idea',
          id: 'i1',
          title: `Community ${S}garden${E} idea`,
          snippet: `Neighbours share the ${S}garden${E}.`,
          status: 'inbox',
          archived: false,
          updatedAt: '2026-11-08T10:00:00.000Z',
        },
      ],
    },
    { type: 'project', total: 0, items: [] },
    {
      type: 'task',
      total: 7,
      items: [
        {
          type: 'task',
          id: 't1',
          title: `Order ${S}garden${E} hoses`,
          snippet: null,
          status: 'todo',
          project: { id: 'p1', title: 'Garden app' },
          updatedAt: '2026-11-08T10:00:00.000Z',
        },
      ],
    },
    { type: 'note', total: 0, items: [] },
    { type: 'resource', total: 0, items: [] },
  ],
};

describe('Highlighted', () => {
  it('highlights the marked words', () => {
    const { container } = render(
      <Highlighted text={`a ${S}garden${E} plan`} />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(1);
    expect(container.querySelector('mark')).toHaveTextContent('garden');
    expect(container).toHaveTextContent('a garden plan');
  });

  it('shows HTML in the text as plain text, never runs it', () => {
    const { container } = render(
      <Highlighted text={`<img src=x onerror=alert(1)> ${S}<b>hi</b>${E}`} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container).toHaveTextContent(
      '<img src=x onerror=alert(1)> <b>hi</b>',
    );
  });

  it('removes markers for links', () => {
    expect(plainText(`Order ${S}garden${E} hoses`)).toBe('Order garden hoses');
    expect(resultHref(results.groups[2].items[0])).toBe(
      '/tasks?view=all&search=Order%20garden%20hoses',
    );
  });
});

describe('SearchDialog', () => {
  beforeEach(() => push.mockReset());

  it('opens with Ctrl+K, shows grouped results, and opens one with Enter', async () => {
    mockApi({ 'GET /search?q=gard': () => jsonResponse(results) });
    renderWithProviders(<SearchDialog />);

    await userEvent.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog', {
      name: 'Search IdeaBloom',
    });
    await userEvent.type(
      within(dialog).getByRole('combobox', { name: 'Search everything' }),
      'gard',
    );

    expect(await within(dialog).findByText('Ideas (1)')).toBeInTheDocument();
    expect(within(dialog).getByText('Tasks (7)')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Projects/)).toBeNull(); // empty groups hidden

    await userEvent.keyboard('{Enter}'); // the first result is selected
    expect(push).toHaveBeenCalledWith('/ideas/i1');
  });

  it('says when nothing matches', async () => {
    mockApi({
      'GET /search?q=zzz': () =>
        jsonResponse({
          query: 'zzz',
          groups: results.groups.map((g) => ({ ...g, total: 0, items: [] })),
        }),
    });
    renderWithProviders(<SearchDialog />);

    await userEvent.click(screen.getByRole('button', { name: /Search/ }));
    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Search everything' }),
      'zzz',
    );
    expect(
      await screen.findByText('Nothing found for "zzz".'),
    ).toBeInTheDocument();
  });
});

describe('SearchView', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams('q=gard');
  });

  it('shows results grouped by type with highlighted words', async () => {
    mockApi({ 'GET /search?q=gard&limit=5': () => jsonResponse(results) });
    renderWithProviders(<SearchView />);

    expect(await screen.findByText('8 results for “gard”')).toBeInTheDocument();
    const ideas = screen.getByRole('region', { name: /Ideas/ });
    const link = within(ideas).getByRole('link', {
      name: 'Community garden idea',
    });
    expect(link).toHaveAttribute('href', '/ideas/i1');
    expect(within(link).getByText('garden').tagName).toBe('MARK');
    expect(screen.queryByRole('region', { name: /Projects/ })).toBeNull();
  });

  it('shows more of one type through the URL', async () => {
    mockApi({ 'GET /search?q=gard&limit=5': () => jsonResponse(results) });
    renderWithProviders(<SearchView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Show more tasks' }),
    );
    expect(replace).toHaveBeenCalledWith('/search?q=gard&type=task', {
      scroll: false,
    });
  });

  it('can include archived ideas', async () => {
    const fetchMock = mockApi({
      'GET /search?q=gard&limit=5': () => jsonResponse(results),
    });
    renderWithProviders(<SearchView />);

    await screen.findByText('8 results for “gard”');
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Include archived ideas' }),
    );
    expect(replace).toHaveBeenCalledWith('/search?q=gard&archived=true', {
      scroll: false,
    });
    expect(fetchMock).toHaveBeenCalled();
  });
});
