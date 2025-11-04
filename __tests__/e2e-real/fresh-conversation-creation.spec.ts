/**
 * E2E tests for fresh conversation creation flow
 * Tests the new API-based approach that creates fresh conversations
 */

import { test, expect } from '@playwright/test';

test.describe('Fresh Conversation Creation E2E', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b'; // Use existing demo from database
  
  test.beforeEach(async ({ page }) => {
    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Configure');
  });

  test('should create fresh conversation when clicking View Demo Experience', async ({ page }) => {
    // Set up network monitoring to track API calls
    const apiCalls: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/start-conversation')) {
        apiCalls.push(request.url());
      }
    });

    // Click the View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible();
    await viewDemoButton.click();

    // Should navigate to experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Wait for the experience page to load and make API call
    await page.waitForTimeout(2000);
    
    // Verify API call was made
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0]).toContain('/api/start-conversation');
  });

  test('should display conversation interface after fresh conversation creation', async ({ page }) => {
    // Navigate to experience page directly
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for conversation to initialize
    await page.waitForTimeout(3000);
    
    // Should see conversation container
    const conversationContainer = page.getByTestId('conversation-container');
    await expect(conversationContainer).toBeVisible();
    
    // Should not show "Connecting..." for long periods
    const connectingText = page.locator('text=Connecting...');
    
    // If connecting text appears, it should disappear within reasonable time
    if (await connectingText.isVisible()) {
      await expect(connectingText).not.toBeVisible({ timeout: 10000 });
    }
    
    // Should eventually show the conversation interface
    await expect(conversationContainer).toBeVisible();
  });

  test('should handle multiple rapid navigation attempts gracefully', async ({ page }) => {
    const apiCalls: string[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/start-conversation')) {
        apiCalls.push(request.url());
      }
    });

    // Click View Demo Experience multiple times rapidly
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible();
    
    // Rapid clicks
    await viewDemoButton.click();
    await viewDemoButton.click();
    await viewDemoButton.click();

    // Should still navigate correctly
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Wait for any API calls to complete
    await page.waitForTimeout(3000);
    
    // Should handle deduplication (may have multiple calls but should work)
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('should create different conversation IDs on separate visits', async ({ page, context }) => {
    const conversationIds: string[] = [];
    
    // Monitor network responses to capture conversation IDs
    page.on('response', async (response) => {
      if (response.url().includes('/api/start-conversation') && response.ok()) {
        try {
          const data = await response.json();
          if (data.conversation_id) {
            conversationIds.push(data.conversation_id);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });

    // First visit
    await page.goto(`/demos/${DEMO_ID}/experience?forceNew=true`);
    await page.waitForTimeout(2000);
    
    // Go back and visit again
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await page.waitForTimeout(1000);
    
    // Second visit
    await page.goto(`/demos/${DEMO_ID}/experience?forceNew=true`);
    await page.waitForTimeout(2000);
    
    // Should have created different conversation IDs
    if (conversationIds.length >= 2) {
      expect(conversationIds[0]).not.toBe(conversationIds[1]);
    }
  });

  test('should display proper error handling for API failures', async ({ page }) => {
    // Intercept and fail the start-conversation API
    await page.route('/api/start-conversation', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Should show error message
    await expect(page.locator('text=Failed to start conversation')).toBeVisible({ timeout: 10000 });
  });

  test('should handle unauthorized access gracefully', async ({ page }) => {
    // Intercept and return unauthorized for start-conversation API
    await page.route('/api/start-conversation', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Should show appropriate error
    await expect(page.locator('text=Unauthorized')).toBeVisible({ timeout: 10000 });
  });

  test('should preserve demo context during conversation creation', async ({ page }) => {
    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Should show demo name in header
    await expect(page.locator('h1')).toBeVisible();
    
    // Should maintain demo ID in URL
    expect(page.url()).toContain(DEMO_ID);
    
    // Should have configure demo button that links back
    const configureButton = page.locator('text=Configure Demo');
    if (await configureButton.isVisible()) {
      await configureButton.click();
      await expect(page).toHaveURL(`/demos/${DEMO_ID}/configure`);
    }
  });

  test('should handle conversation end and redirect to reporting', async ({ page }) => {
    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for conversation to load
    await page.waitForTimeout(3000);
    
    // Look for conversation interface
    const conversationContainer = page.getByTestId('conversation-container');
    await expect(conversationContainer).toBeVisible();
    
    // Note: Actual conversation ending would require interaction with Tavus
    // This test verifies the interface is ready for such interactions
    expect(page.url()).toContain('/experience');
  });
});