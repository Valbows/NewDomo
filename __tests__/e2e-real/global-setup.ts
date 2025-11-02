import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or home
    await page.waitForURL(/\/(dashboard|$)/);
    
    // Save authentication state
    await page.context().storageState({ path: '__tests__/e2e/.auth/user.json' });
    
    console.log('✅ Authentication setup completed');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;