import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    // Trace recording stalls streamed pages in the local Windows/WSL setup.
    // Enable explicitly with --trace on when diagnosing in another environment.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'npm run dev -- --port 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: false,
        timeout: 120000,
      },
});
