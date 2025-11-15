import { defineConfig, devices } from '@playwright/test';

// Use a dedicated port for e2e to avoid conflicts with any locally running dev server
const PORT = process.env.PW_E2E_PORT || '3101';
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '__tests__/e2e',
  outputDir: 'test-artifacts/results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never', outputFolder: 'test-artifacts/reports' }]] : [['list'], ['html', { open: 'on-failure', outputFolder: 'test-artifacts/reports' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: isCI
      ? `PORT=${PORT} env-cmd -f .env.development npm run build && PORT=${PORT} env-cmd -f .env.development npm run start`
      : `PORT=${PORT} env-cmd -f .env.development npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Load environment from .env.development
      NODE_ENV: 'development',
      PORT: PORT,
      
      // E2E Test Configuration
      NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK: 'true',
      NEXT_PUBLIC_DEBUG_DAILY: 'true',
      E2E_DEMO_ID: '42beb287-f385-4100-86a4-bfe7008d531b',
      E2E_VIDEO_TITLE: 'E2E Test Video',
      
      // Disable E2E test mode to use real APIs
      NEXT_PUBLIC_E2E_TEST_MODE: 'false',
    },
  },
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    // Test projects
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '__tests__/e2e/.auth/user.json',
        launchOptions: {
          args: [
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio'
          ],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
