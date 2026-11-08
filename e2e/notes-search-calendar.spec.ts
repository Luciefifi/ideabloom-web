import { expect, test } from '@playwright/test';
import { apiPost, register, today } from './helpers';

test('a note saves itself and is still there after a reload', async ({
  page,
}) => {
  await register(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: 'New note' }).first().click();
  await expect(page).toHaveURL(/\/notes\/[0-9a-f-]+$/);

  await page.getByLabel('Note title').fill('Soil research');
  await page.getByRole('textbox', { name: 'Note text' }).click();
  await page.keyboard.type('Compost ratios matter more than I thought.');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  await page.reload();
  await expect(page.getByLabel('Note title')).toHaveValue('Soil research');
  await expect(
    page.getByText('Compost ratios matter more than I thought.'),
  ).toBeVisible();
});

test('Ctrl+K finds things, and the calendar shows what is due', async ({
  page,
}) => {
  await register(page);
  await apiPost(page, '/tasks', { title: 'Order compost', dueDate: today() });
  await apiPost(page, '/ideas', { title: 'Compost sharing scheme' });

  // Quick search from anywhere.
  await page.goto('/dashboard');
  // The shortcut works once the page's scripts have loaded (as for a person).
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Search IdeaBloom' });
  await dialog.getByRole('combobox').fill('compo');
  await expect(dialog.getByText('Ideas (1)')).toBeVisible();
  await expect(dialog.getByText('Tasks (1)')).toBeVisible();
  await dialog.getByRole('option', { name: /Compost sharing scheme/ }).click();
  await expect(page).toHaveURL(/\/ideas\/[0-9a-f-]+$/);

  // The calendar shows today's task.
  await page.goto('/calendar');
  const grid = page.getByRole('table', { name: /tasks, milestones/ });
  await expect(
    grid.getByRole('button', { name: /Task: Order compost/ }),
  ).toBeVisible();
});
