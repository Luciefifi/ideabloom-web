import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct horse battery staple';

/** A new, unique account for each test (the test database is never reset in between). */
export function newUser(name = 'Lucie') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `e2e-${id}@example.com`,
    password: PASSWORD,
    displayName: name,
  };
}

/** Signs up through the real form and waits for the app. */
export async function register(page: Page, user = newUser()) {
  await page.goto('/register');
  await page.getByLabel('Name').fill(user.displayName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return user;
}

/** Faster set-up: creates data through the API, using this browser's login cookies. */
export async function apiPost<T>(page: Page, path: string, data: object) {
  const res = await page.request.post(`/api/v1${path}`, { data });
  expect(res.ok(), `POST ${path} → ${res.status()}`).toBeTruthy();
  return (await res.json()) as T;
}

/** Fails with a readable list if axe finds WCAG 2.1 A/AA problems on the page. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const problems = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map(
          (n) =>
            `${n.target.join(' ')}\n    ${n.html.slice(0, 160)}\n    ${n.failureSummary ?? ''}`,
        )
        .join('\n  ')}`,
  );
  expect(problems, problems.join('\n')).toEqual([]);
}

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
