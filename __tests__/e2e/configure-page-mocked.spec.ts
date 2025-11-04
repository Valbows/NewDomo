/**
 * Test configure page with mocked Supabase responses
 */

import { test, expect } from '@playwright/test';
import { mockDemo, mockVideos } from './mocks/supabase-mock';

test.describe('Configure Page with Mocked Data', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test.beforeEach(async ({ page }) => {
    // Mock the Supabase API responses
    await page.route('**/rest/v1/demos*', async (route) => {
      const url = route.request().url();
      console.log('🔍 Intercepting Supabase request:', url);
      
      if (url.includes(`id=eq.${DEMO_ID}`)) {
        // Return our mock demo data as a single object (for .single() queries)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDemo)
        });
      } else {
        // Return empty array for other requests
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    // Mock videos endpoint
    await page.route('**/rest/v1/demo_videos*', async (route) => {
      console.log('🔍 Intercepting videos request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideos)
      });
    });

    // Mock other endpoints that might be called
    await page.route('**/rest/v1/knowledge_chunks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/rest/v1/conversation_details*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  });

  test('should load configure page with mocked demo data', async ({ page }) => {
    console.log('🚀 Navigating to configure page with mocked data');
    
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Should see the configure page header
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    
    // Should contain the demo name
    await expect(page.locator('h1')).toContainText('E2E Test Demo');
    
    // Should see the tabs
    await expect(page.getByRole('tab', { name: 'Videos' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Knowledge Base' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Agent Settings' })).toBeVisible();
    
    console.log('✅ Configure page loaded successfully with mocked data');
  });

  test('should find View Demo Experience button with mocked data', async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    
    // Look for the View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ View Demo Experience button found');
  });

  test('should navigate to experience page when button is clicked', async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    
    // Click the View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible({ timeout: 10000 });
    await viewDemoButton.click();

    // Should navigate to experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`, { timeout: 10000 });
    
    console.log('✅ Successfully navigated to experience page');
  });
});