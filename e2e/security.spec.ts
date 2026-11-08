import { expect, test } from '@playwright/test';
import { apiPost, register } from './helpers';

test('pages need a login', async ({ page }) => {
  await page.goto('/ideas');
  await expect(page).toHaveURL(/\/login\?next=%2Fideas$/);
});

test("one user can never open another user's data", async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  await register(alice);
  const idea = await apiPost<{ id: string }>(alice, '/ideas', {
    title: "Alice's secret plan",
  });

  const bobContext = await browser.newContext();
  const bob = await bobContext.newPage();
  await register(bob);
  await bob.goto(`/ideas/${idea.id}`);
  await expect(bob.getByText('Idea not found')).toBeVisible();
  await expect(bob.getByText("Alice's secret plan")).toHaveCount(0);

  await aliceContext.close();
  await bobContext.close();
});

test('logging out protects every page again', async ({ page }) => {
  await register(page);
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test('security headers are sent', async ({ page }) => {
  const response = await page.goto('/login');
  const headers = response?.headers() ?? {};
  expect(headers['content-security-policy']).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers['content-security-policy']).toContain("connect-src 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-powered-by']).toBeUndefined();
});
