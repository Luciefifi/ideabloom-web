import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { ApiStatus } from './api-status';

describe('ApiStatus', () => {
  it('shows "API connected" when the health check succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'ok', info: { database: { status: 'up' } } }),
    );

    renderWithProviders(<ApiStatus />);

    expect(await screen.findByText('API connected')).toBeInTheDocument();
  });

  it('shows "Database unavailable" when the API reports 503', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Service Unavailable',
          status: 'error',
        },
        503,
      ),
    );

    renderWithProviders(<ApiStatus />);

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
  });

  it('shows "API unreachable" when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    renderWithProviders(<ApiStatus />);

    expect(await screen.findByText('API unreachable')).toBeInTheDocument();
  });
});
