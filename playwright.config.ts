import { defineConfig, devices } from '@playwright/test';

// Use a dedicated port for e2e to avoid conflicts with any locally running dev server
const PORT = process.env.PW_E2E_PORT || '3101';
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '__tests__/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: isCI
      ? `PORT=${PORT} NEXT_PUBLIC_E2E_TEST_MODE=true NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true npm run build && PORT=${PORT} NEXT_PUBLIC_E2E_TEST_MODE=true NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true npm run start`
      : `PORT=${PORT} NEXT_PUBLIC_E2E_TEST_MODE=true NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio'
          ],
        },
      },
    },
  ],
});
