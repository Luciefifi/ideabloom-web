import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hardNavigate } from '@/lib/navigation';
import {
  jsonResponse,
  mockApi,
  renderWithProviders,
  testUser,
} from '@/test/render';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { DeleteAccount, DownloadData } from './account-data';
import { AppearanceForm } from './appearance-form';
import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';
import { SessionsCard } from './sessions-card';

vi.mock('@/lib/navigation', () => ({ hardNavigate: vi.fn() }));

const lastBody = (fetchMock: ReturnType<typeof mockApi>) =>
  JSON.parse(String(fetchMock.mock.lastCall?.[1]?.body)) as unknown;

describe('ProfileForm', () => {
  it('starts with the saved values and only allows saving after a change', async () => {
    renderWithProviders(<ProfileForm user={testUser} />);

    expect(screen.getByLabelText('Name')).toHaveValue('Lucie Fifi');
    expect(screen.getByLabelText('Email')).toHaveValue('lucie@example.com');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Time zone')).toHaveValue('UTC');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Bio'), 'Hi');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    expect(screen.getByText('2/500')).toBeInTheDocument();
  });

  // Types key by key and picks from ~400 time zones: slow when the whole suite
  // runs in parallel, so it gets more than the default 5 seconds.
  it('saves name, bio and time zone', async () => {
    const fetchMock = mockApi({
      'PATCH /users/me': () =>
        jsonResponse({
          ...testUser,
          displayName: 'Lucie F.',
          bio: 'Building things.',
          timezone: 'Africa/Kigali',
        }),
    });
    renderWithProviders(<ProfileForm user={testUser} />);

    const name = screen.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Lucie F.');
    await userEvent.type(screen.getByLabelText('Bio'), 'Building things.');
    await userEvent.selectOptions(
      screen.getByLabelText('Time zone'),
      'Africa/Kigali',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(lastBody(fetchMock)).toEqual({
        displayName: 'Lucie F.',
        bio: 'Building things.',
        timezone: 'Africa/Kigali',
      }),
    );
    // After saving, the form is "clean" again.
    await vi.waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled(),
    );
  }, 15_000);

  it('sends an emptied bio as null (cleared)', async () => {
    const fetchMock = mockApi({
      'PATCH /users/me': () => jsonResponse({ ...testUser, bio: null }),
    });
    renderWithProviders(<ProfileForm user={{ ...testUser, bio: 'Old bio' }} />);

    await userEvent.clear(screen.getByLabelText('Bio'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() =>
      expect(lastBody(fetchMock)).toMatchObject({ bio: null }),
    );
  });

  it('requires a name', async () => {
    const fetchMock = mockApi({});
    renderWithProviders(<ProfileForm user={testUser} />);

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('ChangePasswordForm', () => {
  async function fill(current: string, next: string, confirm = next) {
    await userEvent.type(screen.getByLabelText('Current password'), current);
    await userEvent.type(screen.getByLabelText('New password'), next);
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      confirm,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Change password' }),
    );
  }

  it('changes the password and clears the form', async () => {
    const fetchMock = mockApi({
      'POST /auth/change-password': () => jsonResponse({ user: testUser }),
    });
    renderWithProviders(<ChangePasswordForm />);

    await fill('my current password', 'a brand new long password');

    await vi.waitFor(() =>
      expect(lastBody(fetchMock)).toEqual({
        currentPassword: 'my current password',
        newPassword: 'a brand new long password',
      }),
    );
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Current password')).toHaveValue(''),
    );
  });

  it('shows a wrong current password next to that field', async () => {
    mockApi({
      'POST /auth/change-password': () =>
        jsonResponse(
          {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Your current password is incorrect.',
          },
          400,
        ),
    });
    renderWithProviders(<ChangePasswordForm />);

    await fill('not my password', 'a brand new long password');

    expect(
      await screen.findByText('Your current password is incorrect.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('checks the new password before calling the API', async () => {
    const fetchMock = mockApi({});
    renderWithProviders(<ChangePasswordForm />);

    await fill('same password here', 'same password here');

    expect(
      await screen.findByText(
        'Choose a password different from your current one',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const sessions = [
  {
    id: 's1',
    device: 'Chrome on Windows',
    signedInAt: '2026-11-01T10:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
    current: true,
  },
  {
    id: 's2',
    device: 'Safari on iOS',
    signedInAt: '2026-10-20T10:00:00.000Z',
    lastActiveAt: '2026-11-05T10:00:00.000Z',
    current: false,
  },
];

const calls = (fetchMock: ReturnType<typeof mockApi>, method: string) =>
  fetchMock.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') === method)
    .map(([url]) => String(url));

describe('SessionsCard', () => {
  it('lists your devices and marks this one', async () => {
    mockApi({ 'GET /auth/sessions': () => jsonResponse(sessions) });
    renderWithProviders(<SessionsCard />);

    const list = await screen.findByRole('list', { name: 'Signed-in devices' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Chrome on WindowsThis device');
    expect(items[1]).toHaveTextContent('Safari on iOS');
  });

  it('signs another device out', async () => {
    const fetchMock = mockApi({
      'GET /auth/sessions': () => jsonResponse(sessions),
      'DELETE /auth/sessions/s2': () => new Response(null, { status: 204 }),
    });
    renderWithProviders(<SessionsCard />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Sign out Safari on iOS' }),
    );
    await vi.waitFor(() =>
      expect(calls(fetchMock, 'DELETE')).toEqual(['/api/v1/auth/sessions/s2']),
    );
    expect(hardNavigate).not.toHaveBeenCalled(); // this device stays signed in
  });

  it('asks for confirmation, then logs out everywhere', async () => {
    const fetchMock = mockApi({
      'GET /auth/sessions': () => jsonResponse(sessions),
      'POST /auth/logout-all': () => new Response(null, { status: 204 }),
    });
    renderWithProviders(<SessionsCard />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Log out of all devices' }),
    );
    expect(
      await screen.findByRole('alertdialog', {
        name: 'Log out of all devices?',
      }),
    ).toBeInTheDocument();
    expect(calls(fetchMock, 'POST')).toEqual([]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Log out everywhere' }),
    );
    await vi.waitFor(() => expect(hardNavigate).toHaveBeenCalledWith('/login'));
  });

  it('does nothing when cancelled', async () => {
    const fetchMock = mockApi({
      'GET /auth/sessions': () => jsonResponse(sessions),
    });
    renderWithProviders(<SessionsCard />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Log out of all devices' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    expect(calls(fetchMock, 'POST')).toEqual([]);
  });
});

describe('AppearanceForm', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('switches to dark right away and saves it to the account', async () => {
    const fetchMock = mockApi({
      'PATCH /users/me': () =>
        jsonResponse({
          ...testUser,
          preferences: { ...testUser.preferences, theme: 'dark' },
        }),
    });
    renderWithProviders(<AppearanceForm user={testUser} />);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await vi.waitFor(() =>
      expect(lastBody(fetchMock)).toEqual({ preferences: { theme: 'dark' } }),
    );
  });

  it('saves the start page', async () => {
    const fetchMock = mockApi({
      'PATCH /users/me': () => jsonResponse(testUser),
    });
    renderWithProviders(<AppearanceForm user={testUser} />);

    await userEvent.selectOptions(screen.getByLabelText('Start page'), 'tasks');
    await vi.waitFor(() =>
      expect(lastBody(fetchMock)).toEqual({
        preferences: { startPage: 'tasks' },
      }),
    );
  });
});

describe('DownloadData', () => {
  it('downloads your data as a JSON file', async () => {
    mockApi({
      'GET /users/me/export': () =>
        jsonResponse({ format: 'ideabloom-export', ideas: [] }),
    });
    const createUrl = vi.fn(() => 'blob:export');
    Object.assign(URL, {
      createObjectURL: createUrl,
      revokeObjectURL: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    renderWithProviders(<DownloadData />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Download my data' }),
    );

    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(
      /^ideabloom-export-\d{4}-\d{2}-\d{2}\.json$/,
    );
    expect(createUrl).toHaveBeenCalled();
  });
});

describe('DeleteAccount', () => {
  it('needs your password and DELETE, then deletes and leaves', async () => {
    const fetchMock = mockApi({
      'DELETE /auth/account': () => new Response(null, { status: 204 }),
    });
    renderWithProviders(<DeleteAccount />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete my account' }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete your account?',
    });
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete permanently',
    });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      within(dialog).getByLabelText('Your password'),
      'secret pass',
    );
    await userEvent.type(
      within(dialog).getByLabelText(/Type DELETE/),
      'delete',
    );
    expect(confirm).toBeDisabled(); // must be exactly DELETE

    await userEvent.clear(within(dialog).getByLabelText(/Type DELETE/));
    await userEvent.type(
      within(dialog).getByLabelText(/Type DELETE/),
      'DELETE',
    );
    await userEvent.click(confirm);

    await vi.waitFor(() =>
      expect(hardNavigate).toHaveBeenCalledWith('/login?deleted=1'),
    );
    expect(lastBody(fetchMock)).toEqual({
      password: 'secret pass',
      confirm: 'DELETE',
    });
  });

  it('shows the API message when the password is wrong', async () => {
    mockApi({
      'DELETE /auth/account': () =>
        jsonResponse(
          { statusCode: 400, message: 'Your password is incorrect.' },
          400,
        ),
    });
    renderWithProviders(<DeleteAccount />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete my account' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.type(
      within(dialog).getByLabelText('Your password'),
      'wrong',
    );
    await userEvent.type(
      within(dialog).getByLabelText(/Type DELETE/),
      'DELETE',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete permanently' }),
    );

    expect(
      await within(dialog).findByText('Your password is incorrect.'),
    ).toBeInTheDocument();
  });
});
