import { expect, test } from '@playwright/test';
import { register } from './helpers';

/**
 * The core journey: sign up, capture an idea, turn it into a project, plan it
 * with tasks, finish one, and see progress on the project and the dashboard.
 */
test('from idea to project to progress', async ({ page }) => {
  await register(page);

  // Capture an idea from the dashboard.
  await page.getByLabel('Capture a new idea').fill('Community garden app');
  await page.getByRole('button', { name: 'Add idea' }).click();
  await expect(page.getByText('Saved "Community garden app"')).toBeVisible();

  // Open it and turn it into a project.
  await page.goto('/ideas');
  await page.getByRole('link', { name: 'Community garden app' }).click();
  await page.getByRole('button', { name: 'Convert to project' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);

  // Plan it: two tasks, then finish one.
  const tasks = page.getByRole('region', { name: 'Tasks' });
  for (const title of ['Sketch the booking screen', 'Invite gardeners']) {
    await tasks.getByLabel('New task').fill(title);
    await tasks.getByRole('button', { name: 'Add task' }).click();
    await expect(tasks.getByRole('button', { name: title })).toBeVisible();
  }
  // Saved on the server first; done tasks then leave the "pending" list.
  await tasks
    .getByRole('checkbox', { name: 'Complete "Sketch the booking screen"' })
    .click();
  await expect(
    tasks.getByRole('button', { name: 'Sketch the booking screen' }),
  ).toHaveCount(0);

  const progress = page.getByRole('region', { name: 'Progress' });
  await expect(progress.getByText('50%')).toBeVisible();
  await expect(progress.getByText('1 of 2 tasks')).toBeVisible();

  // The dashboard reflects it.
  await page.goto('/dashboard');
  const active = page.getByRole('region', { name: 'Projects in progress' });
  await expect(active.getByText('Community garden app')).toBeVisible();
  await expect(active.getByText('50%')).toBeVisible();
  await expect(
    page.getByRole('link', { name: /1\s*Pending tasks/ }),
  ).toBeVisible();
});
