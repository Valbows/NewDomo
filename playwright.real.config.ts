import { defineConfig, devices } from '@playwright/test';

// Dedicated port for real-backend E2E to avoid conflicts
const PORT = process.env.PW_E2E_PORT || '3102';
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*-live\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
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
  // IMPORTANT: Run in dev mode so dev-only endpoints remain enabled (NODE_ENV !== 'production').
  webServer: {
    command: `PORT=${PORT} NEXT_PUBLIC_E2E_TEST_MODE=false NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-real',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio',
          ],
        },
      },
    },
  ],
});
