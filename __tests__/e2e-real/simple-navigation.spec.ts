/**
 * Simple E2E test to verify navigation is working
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Navigation Test', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test('should navigate to demo configure page', async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    console.log('Page title:', await page.locator('h1').textContent());
    
    // Should see the configure page
    await expect(page.locator('h1')).toContainText('Configure');
  });

  test('should find View Demo Experience button', async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Look for the View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible({ timeout: 10000 });
    
    console.log('Button found:', await viewDemoButton.textContent());
  });

  test('should navigate to experience page when button is clicked', async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Click the View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible({ timeout: 10000 });
    await viewDemoButton.click();

    // Should navigate to experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`, { timeout: 10000 });
    
    console.log('Successfully navigated to:', page.url());
  });
});