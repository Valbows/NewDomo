import { test as setup, expect } from '@playwright/test';

const authFile = '__tests__/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|$)/);
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});