import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { ForgotPasswordForm } from './forgot-password-form';
import { ResetPasswordForm } from './reset-password-form';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => searchParams,
}));

describe('ForgotPasswordForm', () => {
  it('confirms without revealing whether the account exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'If an account exists…' }, 202),
    );
    renderWithProviders(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'lucie@example.com');
    await userEvent.click(
      screen.getByRole('button', { name: 'Send reset link' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      /If an account exists for lucie@example\.com/,
    );
  });
});

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams('token=abc123');
  });

  it('explains what to do when the link has no token', () => {
    searchParams = new URLSearchParams();
    renderWithProviders(<ResetPasswordForm />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This reset link is incomplete',
    );
    expect(
      screen.getByRole('link', { name: 'request a new one' }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('sends the token with the new password, then goes to login', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ message: 'ok' }));
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText('New password'),
      'a brand new long password',
    );
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      'a brand new long password',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Set new password' }),
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      token: 'abc123',
      newPassword: 'a brand new long password',
    });
  });

  it('shows the API message for an expired link', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          error: 'Bad Request',
          message:
            'This reset link is invalid or has expired. Please request a new one.',
        },
        400,
      ),
    );
    renderWithProviders(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText('New password'),
      'a brand new long password',
    );
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      'a brand new long password',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Set new password' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'invalid or has expired',
    );
  });
});
