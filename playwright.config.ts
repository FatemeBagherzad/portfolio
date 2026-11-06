import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Stop a stray `test.only` from silently skipping the suite in CI.
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Serial in CI so the single runner is not oversubscribed.
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Tests run against the production build, which is what actually deploys —
  // the dev server has different CSS handling and no minification.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
