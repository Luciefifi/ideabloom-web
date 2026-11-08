import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: a real browser using the real API and the TEST database.
 *
 *   1. npm run db:up        (in ideabloom-api: starts the test database too)
 *   2. npm run e2e          (here: starts both apps, runs the tests, stops them)
 *
 * Ports differ from development (API 4001, web 3100) so a running dev setup
 * isn't disturbed, and the API runs with NODE_ENV=test, so it only ever touches
 * the throwaway test database from ideabloom-api/.env.test.
 */
const API_PORT = 4001; // matches ideabloom-api/.env.test
const WEB_PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Build the API, bring the test database's tables up to date, start it.
      command: 'npm run build && npm run migration:run && npm run start:prod',
      cwd: '../ideabloom-api',
      env: { NODE_ENV: 'test' },
      url: `http://localhost:${API_PORT}/api/v1/health`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `npx next dev --port ${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
