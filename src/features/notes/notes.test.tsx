import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { describeUsage } from '@/lib/usage';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { NoteDetailView } from './components/note-detail-view';
import { normalizeLink, NoteEditor } from './components/note-editor';
import { NotesView } from './components/notes-view';
import { editedAgo } from './note-styles';
import type { Note, NoteSummary } from './types';

const push = vi.fn();
const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/notes',
  useSearchParams: () => searchParams,
  useParams: () => ({ id: 'n1' }),
}));

const doc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

function summary(overrides: Partial<NoteSummary> = {}): NoteSummary {
  return {
    id: 'n1',
    title: 'Launch plan',
    excerpt: 'Order compost before spring',
    isPinned: true,
    category: null,
    tags: [{ id: 't1', name: 'garden' }],
    idea: null,
    project: { id: 'p1', title: 'Garden app' },
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function note(overrides: Partial<Note> = {}): Note {
  const { excerpt: _excerpt, ...rest } = summary();
  void _excerpt;
  return { ...rest, content: doc('Order compost'), ...overrides };
}

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
      data: [{ id: 'p1', title: 'Garden app' }],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    }),
};

const bodyOf = (
  fetchMock: ReturnType<typeof mockApi>,
  method: string,
  path: string,
) =>
  fetchMock.mock.calls
    .filter(
      ([url, init]) => init?.method === method && String(url).endsWith(path),
    )
    .map(([, init]) => JSON.parse(String(init?.body)) as unknown);

describe('helpers', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['https://example.com/a', 'https://example.com/a'],
    ['mailto:me@example.com', 'mailto:me@example.com'],
    ['javascript:alert(1)', null],
    ['data:text/html,hi', null],
    ['  ', null],
  ])('normalizeLink(%j) → %j', (input, expected) => {
    expect(normalizeLink(input)).toBe(expected);
  });

  it('describes how many items use a tag or category', () => {
    expect(
      describeUsage({ ideaCount: 2, noteCount: 1, resourceCount: 3 }),
    ).toEqual({
      total: 6,
      text: '2 ideas, 1 note and 3 resources',
      short: '2 ideas · 1 note · 3 resources',
    });
    expect(describeUsage({})).toMatchObject({ total: 0, short: 'Not used' });
  });

  it('says when a note was edited', () => {
    const now = new Date('2026-11-08T12:00:00Z');
    expect(editedAgo('2026-11-08T11:59:40Z', now)).toBe('edited just now');
    expect(editedAgo('2026-11-08T11:55:00Z', now)).toBe('edited 5 minutes ago');
  });
});

describe('NotesView', () => {
  beforeEach(() => {
    push.mockReset();
    searchParams = new URLSearchParams();
  });

  it('shows note cards with their preview, tags and project', async () => {
    mockApi({
      ...lookups,
      'GET /notes?page=1&pageSize=24': () =>
        jsonResponse({
          data: [summary()],
          meta: { page: 1, pageSize: 24, total: 1, totalPages: 1 },
        }),
    });
    renderWithProviders(<NotesView />);

    const card = (
      await screen.findByRole('link', { name: 'Launch plan' })
    ).closest('article') as HTMLElement;
    expect(card).toHaveAttribute('aria-labelledby', 'note-n1-title');
    expect(
      within(card).getByText('Order compost before spring'),
    ).toBeInTheDocument();
    expect(within(card).getByLabelText('Pinned')).toBeInTheDocument();
    expect(within(card).getByText('Garden app')).toBeInTheDocument();
  });

  it('creates a note and opens it', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /notes?page=1&pageSize=24': () =>
        jsonResponse({
          data: [],
          meta: { page: 1, pageSize: 24, total: 0, totalPages: 0 },
        }),
      'POST /notes': () => jsonResponse(note({ id: 'new-note' }), 201),
    });
    renderWithProviders(<NotesView />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'New note' }),
    );
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/notes/new-note'),
    );
    expect(bodyOf(fetchMock, 'POST', '/notes')).toEqual([{}]);
  });
});

describe('NoteEditor', () => {
  it('shows the saved text and a formatting toolbar', async () => {
    renderWithProviders(
      <NoteEditor initialContent={doc('Hello garden')} onChange={vi.fn()} />,
    );

    expect(await screen.findByText('Hello garden')).toBeInTheDocument();
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    for (const name of ['Bold', 'Heading', 'Checklist', 'Link', 'Undo']) {
      expect(within(toolbar).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('refuses unsafe links', async () => {
    renderWithProviders(
      <NoteEditor initialContent={doc('Hello')} onChange={vi.fn()} />,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Link' }));
    await userEvent.type(
      screen.getByLabelText('Link address'),
      'javascript:alert(1)',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      screen.getByText('Use a web address (https://…) or an email (mailto:…).'),
    ).toBeInTheDocument();
  });
});

describe('NoteDetailView', () => {
  beforeEach(() => push.mockReset());

  it('autosaves the title after you stop typing', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /notes/n1': () => jsonResponse(note()),
      'PATCH /notes/n1': () => jsonResponse(note({ title: 'Spring plan' })),
    });
    renderWithProviders(<NoteDetailView />);

    const title = await screen.findByLabelText('Note title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Spring plan');
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');

    await vi.waitFor(
      () => expect(screen.getByRole('status')).toHaveTextContent('Saved'),
      { timeout: 3000 },
    );
    // One save for the whole burst of typing.
    expect(bodyOf(fetchMock, 'PATCH', '/notes/n1')).toEqual([
      { title: 'Spring plan' },
    ]);
  });

  it('pins the note right away', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /notes/n1': () => jsonResponse(note({ isPinned: false })),
      'PATCH /notes/n1': () => jsonResponse(note({ isPinned: true })),
    });
    renderWithProviders(<NoteDetailView />);

    await userEvent.click(await screen.findByRole('button', { name: 'Pin' }));
    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PATCH', '/notes/n1')).toEqual([
        { isPinned: true },
      ]),
    );
    expect(
      await screen.findByRole('button', { name: 'Unpin' }),
    ).toBeInTheDocument();
  });

  it('attaches the note to a project', async () => {
    const fetchMock = mockApi({
      ...lookups,
      'GET /notes/n1': () => jsonResponse(note({ project: null })),
      'PATCH /notes/n1': () => jsonResponse(note()),
    });
    renderWithProviders(<NoteDetailView />);

    const select = await screen.findByLabelText('Attached to');
    await within(select).findByRole('option', { name: 'Garden app' });
    await userEvent.selectOptions(select, 'project:p1');
    await vi.waitFor(() =>
      expect(bodyOf(fetchMock, 'PATCH', '/notes/n1')).toEqual([
        { ideaId: null, projectId: 'p1' },
      ]),
    );
  });

  it('says when the note does not exist', async () => {
    mockApi({
      ...lookups,
      'GET /notes/n1': () =>
        jsonResponse({ statusCode: 404, message: 'Note not found' }, 404),
    });
    renderWithProviders(<NoteDetailView />);

    expect(await screen.findByText('Note not found')).toBeInTheDocument();
  });
});
