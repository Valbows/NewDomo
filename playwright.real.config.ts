import { defineConfig, devices } from "@playwright/test";

// Dedicated port for real-backend E2E to avoid conflicts
const PORT = process.env.PW_E2E_PORT || "3102";
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "__tests__/e2e",
  outputDir: "test-artifacts/results",
  testMatch: /.*\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never", outputFolder: "test-artifacts/reports" }]]
    : [["list"], ["html", { open: "on-failure", outputFolder: "test-artifacts/reports" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    storageState: "__tests__/e2e/.auth/user.json",
  },
  // IMPORTANT: Run in dev mode with real API keys from .env.development
  webServer: {
    command: `PORT=${PORT} env-cmd -f .env.development npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Ensure E2E mode is disabled for real API testing
      NEXT_PUBLIC_E2E_TEST_MODE: 'false',
      NEXT_PUBLIC_DEBUG_DAILY: 'true',
      NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK: 'true',
    },
  },
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    // Test projects
    {
      name: "chromium-real",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "__tests__/e2e/.auth/user.json",
        launchOptions: {
          args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        },
      },
      dependencies: ['setup'],
    },
  ],
});
