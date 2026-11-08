import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { CategoryManager } from './category-manager';
import { NewIdeaSheet } from './new-idea-sheet';
import { TagManager } from './tag-manager';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const body = (fetchMock: ReturnType<typeof mockApi>, method: string) =>
  JSON.parse(
    String(
      fetchMock.mock.calls.find(([, init]) => init?.method === method)?.[1]
        ?.body,
    ),
  ) as unknown;

describe('CategoryManager', () => {
  it('adds a category with the chosen colour', async () => {
    const fetchMock = mockApi({
      'GET /categories': () => jsonResponse([]),
      'POST /categories': () =>
        jsonResponse({ id: 'c1', name: 'Learning', color: 'sky' }, 201),
    });
    renderWithProviders(<CategoryManager />);

    await userEvent.type(screen.getByLabelText('Category name'), 'Learning');
    await userEvent.click(screen.getByRole('radio', { name: 'Sky' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add category' }));

    await vi.waitFor(() =>
      expect(body(fetchMock, 'POST')).toEqual({
        name: 'Learning',
        color: 'sky',
      }),
    );
  });

  it('warns how many items will become uncategorized before deleting', async () => {
    mockApi({
      'GET /categories': () =>
        jsonResponse([
          {
            id: 'c1',
            name: 'Health',
            color: 'emerald',
            ideaCount: 3,
            noteCount: 2,
            resourceCount: 0,
          },
        ]),
    });
    renderWithProviders(<CategoryManager />);

    expect(await screen.findByText('3 ideas · 2 notes')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete category "Health"' }),
    );

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Used by 3 ideas and 2 notes. Nothing else is deleted: they become uncategorized.',
    );
  });

  it('shows a duplicate-name error from the API', async () => {
    mockApi({
      'GET /categories': () => jsonResponse([]),
      'POST /categories': () =>
        jsonResponse(
          {
            statusCode: 409,
            error: 'Conflict',
            message: 'You already have a category named "Health"',
          },
          409,
        ),
    });
    renderWithProviders(<CategoryManager />);

    await userEvent.type(screen.getByLabelText('Category name'), 'Health');
    await userEvent.click(screen.getByRole('button', { name: 'Add category' }));

    expect(
      await screen.findByText('You already have a category named "Health"'),
    ).toBeInTheDocument();
  });
});

describe('TagManager', () => {
  it('renames a tag', async () => {
    const fetchMock = mockApi({
      'GET /tags': () =>
        jsonResponse([{ id: 't1', name: 'mobil', ideaCount: 2 }]),
      'PATCH /tags/t1': () => jsonResponse({ id: 't1', name: 'mobile' }),
    });
    renderWithProviders(<TagManager />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Rename tag "mobil"' }),
    );
    const input = screen.getByLabelText('New name for tag mobil');
    await userEvent.clear(input);
    await userEvent.type(input, 'mobile');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() =>
      expect(body(fetchMock, 'PATCH')).toEqual({ name: 'mobile' }),
    );
  });
});

describe('NewIdeaSheet', () => {
  it('creates an idea with details from the side panel', async () => {
    const fetchMock = mockApi({
      'GET /categories': () => jsonResponse([]),
      'GET /tags': () => jsonResponse([]),
      'POST /ideas': () => jsonResponse({ id: 'new', title: 'Podcast' }, 201),
    });
    renderWithProviders(<NewIdeaSheet />);

    await userEvent.click(screen.getByRole('button', { name: 'New idea' }));
    await userEvent.type(await screen.findByLabelText('Title'), 'Podcast');
    await userEvent.type(screen.getByLabelText('Tags'), 'audio{Enter}');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'planned');
    await userEvent.click(screen.getByRole('button', { name: 'Create idea' }));

    await vi.waitFor(() =>
      expect(body(fetchMock, 'POST')).toMatchObject({
        title: 'Podcast',
        status: 'planned',
        tags: ['audio'],
        description: null,
        priority: null,
        categoryId: null,
        links: [],
      }),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'New idea' }),
      ).not.toBeInTheDocument(),
    );
  });
});
