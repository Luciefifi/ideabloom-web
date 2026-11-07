import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { hardNavigate } from '@/lib/navigation';
import {
  jsonResponse,
  mockApi,
  renderWithProviders,
  testUser,
} from '@/test/render';
import { initials, UserMenu } from './user-menu';

vi.mock('@/lib/navigation', () => ({ hardNavigate: vi.fn() }));

function renderMenu() {
  return renderWithProviders(
    <SidebarProvider>
      <UserMenu />
    </SidebarProvider>,
  );
}

describe('UserMenu', () => {
  it('logs out and reloads to the login page', async () => {
    const fetchMock = mockApi({
      'GET /users/me': () => jsonResponse(testUser),
      'POST /auth/logout': () => new Response(null, { status: 204 }),
    });
    renderMenu();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Account menu for Lucie Fifi',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Log out' }),
    );

    await vi.waitFor(() => expect(hardNavigate).toHaveBeenCalledWith('/login'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('links to the settings page', async () => {
    mockApi({ 'GET /users/me': () => jsonResponse(testUser) });
    renderMenu();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Account menu for Lucie Fifi',
      }),
    );

    expect(
      await screen.findByRole('menuitem', { name: 'Settings' }),
    ).toHaveAttribute('href', '/settings');
  });
});

describe('initials', () => {
  it.each([
    ['Lucie Fifi', 'LF'],
    ['lucie', 'L'],
    ['  Ada   Lovelace  King ', 'AL'],
  ])('%s → %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
