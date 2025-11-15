import { defineConfig, devices } from '@playwright/test';

// Use a dedicated port for CI e2e to avoid conflicts
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
    command: `PORT=${PORT} npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // CI Environment with mocked APIs
      NODE_ENV: 'development',
      PORT: PORT,
      
      // Mock Supabase for CI
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SECRET_KEY: 'secret',
      
      // Mock Tavus for CI
      TAVUS_API_KEY: 'dummy',
      TAVUS_BASE_URL: 'https://mock-tavus.com/v2',
      TAVUS_REPLICA_ID: 'mock-replica',
      COMPLETE_PERSONA_ID: 'mock-persona',
      DOMO_AI_OBJECTIVES_ID: 'mock-objectives',
      DOMO_AI_GUARDRAILS_ID: 'mock-guardrails',
      TAVUS_LLM_MODEL: 'tavus-llama-4',
      TAVUS_TOOLS_ENABLED: 'true',
      TAVUS_MINIMAL_TOOLS: 'false',
      
      // Mock Webhooks (use same secret as test for signature verification)
      TAVUS_WEBHOOK_SECRET: 'domo_webhook_secret_dev_2025',
      TAVUS_WEBHOOK_TOKEN: 'mock-token',
      NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN: 'mock-token',
      NEXT_PUBLIC_BASE_URL: baseURL,
      
      // Mock ElevenLabs
      ELEVENLABS_API_KEY: 'dummy',
      ELEVENLABS_URL: 'https://mock-elevenlabs.com/v1',
      
      // Mock OpenAI
      OPENAI_API_KEY: 'dummy',
      OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
      
      // Mock Sentry
      SENTRY_DSN: 'http://example@localhost/1',
      NEXT_PUBLIC_SENTRY_DSN: 'http://example@localhost/1',
      
      // E2E Test Configuration for CI
      NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK: 'true',
      NEXT_PUBLIC_DEBUG_DAILY: 'true',
      E2E_DEMO_ID: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
      E2E_VIDEO_TITLE: 'E2E Test Video',
      
      // Enable E2E test mode for mocked APIs
      NEXT_PUBLIC_E2E_TEST_MODE: 'true',
      
      // Disable telemetry
      NEXT_TELEMETRY_DISABLED: '1',
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