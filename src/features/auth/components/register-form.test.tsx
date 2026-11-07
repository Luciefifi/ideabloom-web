import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { RegisterForm } from './register-form';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

async function fill(values: {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  const u = userEvent.setup();
  if (values.name) await u.type(screen.getByLabelText('Name'), values.name);
  if (values.email) await u.type(screen.getByLabelText('Email'), values.email);
  if (values.password)
    await u.type(screen.getByLabelText('Password'), values.password);
  if (values.confirm)
    await u.type(screen.getByLabelText('Confirm password'), values.confirm);
  await u.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterForm', () => {
  beforeEach(() => replace.mockReset());

  it('explains the password rule and checks both passwords match', async () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByText(/At least 12 characters/)).toBeInTheDocument();

    await fill({
      name: 'Lucie',
      email: 'lucie@example.com',
      password: 'short',
      confirm: 'different',
    });

    expect(
      await screen.findByText('Use at least 12 characters'),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
  });

  it('creates the account and goes to the dashboard', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          user: { id: '1', displayName: 'Lucie', email: 'lucie@example.com' },
        },
        201,
      ),
    );
    renderWithProviders(<RegisterForm />);

    await fill({
      name: 'Lucie',
      email: 'lucie@example.com',
      password: 'correct horse battery staple',
      confirm: 'correct horse battery staple',
    });

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    // confirmPassword is only for the form; it's never sent to the API.
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      displayName: 'Lucie',
      email: 'lucie@example.com',
      password: 'correct horse battery staple',
    });
  });

  it('shows "email already exists" next to the email field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 409,
          error: 'Conflict',
          message: 'An account with this email already exists',
        },
        409,
      ),
    );
    renderWithProviders(<RegisterForm />);

    await fill({
      name: 'Lucie',
      email: 'lucie@example.com',
      password: 'correct horse battery staple',
      confirm: 'correct horse battery staple',
    });

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
