import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { AppSidebar } from './app-sidebar';
import { allNavItems, isNavItemActive } from './nav-items';

// Pretend the user is viewing a single idea.
vi.mock('next/navigation', () => ({
  usePathname: () => '/ideas/123',
}));

function renderSidebar() {
  return renderWithProviders(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'ok' }),
    );
  });

  it('links to every section of the app', () => {
    renderSidebar();

    for (const item of allNavItems) {
      expect(screen.getByRole('link', { name: item.title })).toHaveAttribute(
        'href',
        item.href,
      );
    }
  });

  it('marks the current section as the active page', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Ideas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('shows the API connection status', async () => {
    renderSidebar();

    expect(await screen.findByText('API connected')).toBeInTheDocument();
  });
});

describe('isNavItemActive', () => {
  const ideas = allNavItems.find((item) => item.href === '/ideas')!;

  it.each([
    ['/ideas', true],
    ['/ideas/123', true],
    ['/ideas-archive', false],
    ['/projects', false],
  ])('%s → %s', (pathname, expected) => {
    expect(isNavItemActive(ideas, pathname)).toBe(expected);
  });
});
