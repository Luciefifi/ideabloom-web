import { expect, test } from '@playwright/test';
import { apiPost, expectAccessible, register, today } from './helpers';

test('dark mode is saved and applied before the page appears', async ({
  page,
}) => {
  await register(page);
  await page.goto('/settings');
  await page.locator('label', { hasText: 'Dark' }).click();
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByText('Theme: Dark')).toBeVisible();

  // On a fresh load, the inline script sets the class before React runs.
  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

const PAGES = [
  '/dashboard',
  '/ideas',
  '/projects',
  '/tasks',
  '/notes',
  '/resources',
  '/calendar',
  '/search?q=garden',
  '/settings',
];

for (const theme of ['light', 'dark'] as const) {
  test(`main pages have no accessibility problems (${theme})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await register(page);
    // Some content, so lists, badges and charts are checked too.
    const project = await apiPost<{ id: string }>(page, '/projects', {
      title: 'Garden app',
    });
    await apiPost(page, '/tasks', {
      title: 'Garden task',
      dueDate: today(),
      projectId: project.id,
      priority: 'high',
    });
    await apiPost(page, '/ideas', { title: 'Garden idea', tags: ['garden'] });
    await apiPost(page, '/notes', { title: 'Garden note' });
    await apiPost(page, '/resources', {
      title: 'Garden guide',
      url: 'https://example.com',
    });
    await page.request.patch('/api/v1/users/me', {
      data: { preferences: { theme } },
    });

    for (const path of [...PAGES, `/projects/${project.id}`]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveClass(
        theme === 'dark' ? /dark/ : /^(?!.*\bdark\b)/,
      );
      await test.step(`${theme}: ${path}`, () => expectAccessible(page));
    }
  });
}
