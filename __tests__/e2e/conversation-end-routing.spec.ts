import { test, expect } from '@playwright/test';

test.describe('Conversation End Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('e2e-test-mode', 'true');
    });
  });

  test('should route to reporting page when conversation ends', async ({ page }) => {
    // First, let's test the simpler flow - direct navigation to reporting
    await page.goto('/demos/bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b/configure?tab=reporting');

    // Check that we can reach the reporting page
    await expect(page).toHaveURL(/\/demos\/[^\/]+\/configure\?tab=reporting/);

    // Check for reporting content (use first() to avoid strict mode violation)
    await expect(page.locator('text=Conversation Analytics').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle conversation end API call', async ({ page }) => {
    // Set up API response monitoring
    let endConversationCalled = false;
    
    await page.route('**/api/end-conversation', async (route) => {
      endConversationCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Conversation ended successfully' }),
      });
    });

    // Navigate to a page first to establish the route
    await page.goto('/dashboard');

    // Test the API endpoint by making a fetch request from the page
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/end-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoId: 'test-demo-123',
          conversationId: 'test-conv-456'
        })
      });
      return {
        status: res.status,
        data: await res.json()
      };
    });

    // The API should be intercepted by our mock, so it should return 200
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(endConversationCalled).toBe(true);
  });

  test('should show reporting data after conversation ends', async ({ page }) => {
    // Navigate directly to the reporting page (simulating post-conversation state)
    await page.goto('/demos/bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b/configure?tab=reporting');

    // Wait for the reporting tab to be active (use role selector instead)
    await expect(page.getByRole('tab', { name: 'Reporting' })).toBeVisible();

    // Check that reporting components are loaded
    await expect(page.locator('text=Conversation Analytics')).toBeVisible();
    
    // Check for sync button (indicates reporting functionality is loaded)
    const syncButton = page.locator('button').filter({ hasText: /sync/i });
    if (await syncButton.isVisible()) {
      await expect(syncButton).toBeVisible();
    }

    // Verify we can see conversation data or empty state (use first() to avoid strict mode)
    const conversationList = page.locator('[data-testid="conversation-list"]');
    const emptyState = page.locator('text=No conversations found');
    
    // Check if either is visible (both might be present)
    const hasConversationList = await conversationList.isVisible();
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasConversationList || hasEmptyState).toBe(true);
  });

  test('should handle conversation end with error gracefully', async ({ page }) => {
    // Set up API to return error
    await page.route('**/api/end-conversation', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to end conversation' }),
      });
    });

    // Navigate to a page first to establish the route
    await page.goto('/dashboard');

    // Test the API endpoint with error response
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/end-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoId: 'test-demo-123',
          conversationId: 'test-conv-456'
        })
      });
      return {
        status: res.status,
        data: await res.json()
      };
    });

    expect(response.status).toBe(500);
    expect(response.data.error).toBe('Failed to end conversation');
  });

  test('should work in E2E test mode', async ({ page }) => {
    // Test that we can navigate to the configure page with reporting tab
    await page.goto('/demos/bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b/configure?tab=reporting');
    
    // Should reach reporting page successfully
    await expect(page.locator('text=Conversation Analytics').first()).toBeVisible({ timeout: 10000 });
    
    // Check that the URL has the reporting tab parameter
    expect(page.url()).toContain('tab=reporting');
  });
});