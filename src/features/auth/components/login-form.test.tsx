import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { LoginForm } from './login-form';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const user = {
  id: '1',
  email: 'lucie@example.com',
  displayName: 'Lucie',
  bio: null,
  timezone: 'UTC',
  preferences: { theme: 'system', startPage: 'dashboard' },
  createdAt: '2026-11-07T00:00:00.000Z',
};

async function fillAndSubmit(email: string, password: string) {
  const u = userEvent.setup();
  await u.type(screen.getByLabelText('Email'), email);
  await u.type(screen.getByLabelText('Password'), password);
  await u.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('shows validation messages without calling the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    renderWithProviders(<LoginForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs in and returns to the page the user wanted', async () => {
    searchParams = new URLSearchParams('next=/ideas/42');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ user }));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('lucie@example.com', 'correct horse battery staple');

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/ideas/42'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/auth/login');
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'lucie@example.com',
      password: 'correct horse battery staple',
    });
  });

  it('ignores a ?next= that points to another website', async () => {
    searchParams = new URLSearchParams('next=https://evil.example');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ user }));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('lucie@example.com', 'correct horse battery staple');

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('opens your chosen start page when there is no ?next=', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        user: { ...user, preferences: { theme: 'dark', startPage: 'tasks' } },
      }),
    );
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('lucie@example.com', 'correct horse battery staple');

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/tasks'));
  });

  it('confirms a deleted account', () => {
    searchParams = new URLSearchParams('deleted=1');
    renderWithProviders(<LoginForm />);
    expect(
      screen.getByText('Your account and all its content were deleted.'),
    ).toBeInTheDocument();
  });

  it("shows the API's message when the login fails", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password.',
        },
        401,
      ),
    );
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('lucie@example.com', 'wrong password!!');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('lets the user reveal the password they typed', async () => {
    renderWithProviders(<LoginForm />);
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' }),
    );

    expect(password).toHaveAttribute('type', 'text');
  });
});
