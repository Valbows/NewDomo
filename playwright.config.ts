import { defineConfig, devices } from '@playwright/test';

// Use a dedicated port for e2e to avoid conflicts with any locally running dev server
const PORT = process.env.PW_E2E_PORT || '3101';
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '__tests__/e2e',
  outputDir: 'test-results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]] : [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: isCI
      ? `PORT=${PORT} npm run build && PORT=${PORT} npm run start`
      : `PORT=${PORT} npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Load all environment variables from .env.development for real API testing
      NODE_ENV: 'development',
      PORT: PORT,
      
      // Supabase (real API)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
      
      // Tavus (real API)
      TAVUS_API_KEY: process.env.TAVUS_API_KEY || '',
      TAVUS_BASE_URL: process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2',
      TAVUS_REPLICA_ID: process.env.TAVUS_REPLICA_ID || '',
      COMPLETE_PERSONA_ID: process.env.COMPLETE_PERSONA_ID || '',
      DOMO_AI_OBJECTIVES_ID: process.env.DOMO_AI_OBJECTIVES_ID || '',
      DOMO_AI_GUARDRAILS_ID: process.env.DOMO_AI_GUARDRAILS_ID || '',
      TAVUS_LLM_MODEL: process.env.TAVUS_LLM_MODEL || 'tavus-llama-4',
      TAVUS_TOOLS_ENABLED: 'true',
      TAVUS_MINIMAL_TOOLS: 'false',
      
      // Webhooks
      TAVUS_WEBHOOK_SECRET: process.env.TAVUS_WEBHOOK_SECRET || '',
      TAVUS_WEBHOOK_TOKEN: process.env.TAVUS_WEBHOOK_TOKEN || '',
      NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN: process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || '',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${PORT}`,
      
      // ElevenLabs (real API)
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
      ELEVENLABS_URL: process.env.ELEVENLABS_URL || 'https://api.elevenlabs.io/v1',
      
      // OpenAI (real API)
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      
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
