import { test as setup, expect } from '@playwright/test';

const authFile = '__tests__/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // For API-only tests, we don't need actual authentication
  // Just create a minimal storage state file
  
  // Navigate to the app to establish a session
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // For API tests, we don't need to actually log in
  // Just save the current state (which may be unauthenticated)
  await page.context().storageState({ path: authFile });
});