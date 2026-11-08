import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { hardNavigate } from '@/lib/navigation';
import {
  jsonResponse,
  mockApi,
  renderWithProviders,
  testUser,
} from '@/test/render';
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

describe('SessionsCard', () => {
  it('asks for confirmation, then logs out everywhere', async () => {
    const fetchMock = mockApi({
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
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Log out everywhere' }),
    );

    await vi.waitFor(() => expect(hardNavigate).toHaveBeenCalledWith('/login'));
  });

  it('does nothing when cancelled', async () => {
    const fetchMock = mockApi({});
    renderWithProviders(<SessionsCard />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Log out of all devices' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
