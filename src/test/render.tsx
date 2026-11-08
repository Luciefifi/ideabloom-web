import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Renders a component with the same providers the app uses, but with a fresh
 * QueryClient per test and no retries (so failures show up immediately).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
    options,
  );
}

/** Builds a fake fetch Response with a JSON body. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** A typical logged-in user for tests. */
export const testUser = {
  id: 'user-1',
  email: 'lucie@example.com',
  displayName: 'Lucie Fifi',
  bio: null as string | null,
  timezone: 'UTC',
  preferences: {
    theme: 'system' as const,
    startPage: 'dashboard' as 'dashboard' | 'ideas' | 'tasks',
  },
  createdAt: '2026-11-07T00:00:00.000Z',
};

/**
 * Fakes the API by URL path, e.g.
 *   mockApi({ 'GET /users/me': () => jsonResponse(testUser) })
 * Unlisted requests fail the test loudly.
 */
export function mockApi(routes: Record<string, () => Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = String(input).replace('/api/v1', '');
    const handler = routes[`${method} ${path}`];
    if (!handler) {
      throw new Error(`Unexpected request in test: ${method} ${path}`);
    }
    return Promise.resolve(handler());
  });
}
