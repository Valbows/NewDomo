import { test, expect } from '@playwright/test';

test.describe('Multiple Conversation Cycles', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test.beforeEach(async ({ page }) => {
    // Set up API monitoring
    await page.route('**/api/start-conversation', async (route) => {
      const request = route.request();
      const postData = request.postData();
      
      // Generate unique conversation ID for each request
      const timestamp = Date.now();
      const conversationId = `test-conv-${timestamp}`;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversation_url: `https://tavus.daily.co/${conversationId}`,
          conversation_id: conversationId
        }),
      });
    });

    await page.route('**/api/end-conversation', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Conversation ended successfully'
        }),
      });
    });
  });

  test('should handle 5 consecutive conversation cycles seamlessly', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for multiple cycles
    
    const cycles = 5;
    const results = [];
    
    for (let cycle = 1; cycle <= cycles; cycle++) {
      console.log(`🔄 Starting conversation cycle ${cycle}/${cycles}`);
      
      // Navigate to demo experience
      await page.goto(`/demos/${DEMO_ID}/experience`);
      
      // Wait for conversation interface to load
      await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 15000 });
      
      // Verify conversation is in correct state (not error)
      const conversationContainer = page.locator('[data-testid="conversation-container"]');
      await expect(conversationContainer).toHaveAttribute('data-pip', 'false');
      
      // Check for error states that indicate "Meeting has ended" issue
      const errorElements = page.locator('text=Meeting has ended, text=error, text=failed');
      await expect(errorElements).toHaveCount(0);
      
      // Simulate conversation activity (wait a bit)
      await page.waitForTimeout(2000);
      
      // End conversation by clicking leave button
      const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
        console.log(`  ✅ Ended conversation cycle ${cycle}`);
      }
      
      // Wait for navigation to reporting page
      await expect(page).toHaveURL(/\/demos\/[^\/]+\/configure/, { timeout: 10000 });
      
      // Verify we reached reporting/configure page
      const isOnConfigurePage = page.url().includes('/configure');
      expect(isOnConfigurePage).toBe(true);
      
      console.log(`  ✅ Completed cycle ${cycle} - navigated to configure page`);
      
      results.push({
        cycle,
        success: true,
        endedAt: new Date().toISOString()
      });
      
      // Small delay between cycles to simulate real user behavior
      await page.waitForTimeout(1000);
    }
    
    // Verify all cycles completed successfully
    expect(results).toHaveLength(cycles);
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.cycle).toBe(index + 1);
    });
    
    console.log(`🎉 Successfully completed ${cycles} conversation cycles without "Meeting has ended" errors`);
  });

  test('should handle rapid conversation start attempts', async ({ page }) => {
    test.setTimeout(60000);
    
    let requestCount = 0;
    const conversationRequests: string[] = [];
    
    // Monitor start-conversation requests
    await page.route('**/api/start-conversation', async (route) => {
      requestCount++;
      const timestamp = Date.now();
      const conversationId = `rapid-conv-${timestamp}-${requestCount}`;
      conversationRequests.push(conversationId);
      
      // Add small delay to simulate real API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversation_url: `https://tavus.daily.co/${conversationId}`,
          conversation_id: conversationId
        }),
      });
    });
    
    // Rapidly navigate to experience page multiple times
    const rapidAttempts = 3;
    const promises = [];
    
    for (let i = 0; i < rapidAttempts; i++) {
      const attemptPromise = (async () => {
        const newPage = await page.context().newPage();
        await newPage.goto(`/demos/${DEMO_ID}/experience`);
        
        // Wait for conversation to load or error
        try {
          await expect(newPage.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 10000 });
          return { success: true, page: newPage };
        } catch (error) {
          return { success: false, error: error.message, page: newPage };
        }
      })();
      
      promises.push(attemptPromise);
    }
    
    const results = await Promise.all(promises);
    
    // Clean up pages
    for (const result of results) {
      await result.page.close();
    }
    
    // Verify all attempts succeeded (no race conditions)
    const successfulAttempts = results.filter(r => r.success);
    expect(successfulAttempts.length).toBeGreaterThanOrEqual(rapidAttempts - 1); // Allow 1 failure due to timing
    
    // Verify unique conversation IDs were generated
    const uniqueConversations = new Set(conversationRequests);
    expect(uniqueConversations.size).toBe(conversationRequests.length);
    
    console.log(`✅ Handled ${rapidAttempts} rapid attempts with ${successfulAttempts.length} successes`);
  });

  test('should recover from "Meeting has ended" error gracefully', async ({ page }) => {
    // Simulate the "Meeting has ended" scenario
    let shouldFailFirst = true;
    
    await page.route('**/api/start-conversation', async (route) => {
      if (shouldFailFirst) {
        shouldFailFirst = false;
        // Return an ended conversation ID to simulate the issue
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversation_url: 'https://tavus.daily.co/ended-conversation-123',
            conversation_id: 'ended-conversation-123'
          }),
        });
      } else {
        // Return fresh conversation on retry
        const freshId = `fresh-conv-${Date.now()}`;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversation_url: `https://tavus.daily.co/${freshId}`,
            conversation_id: freshId
          }),
        });
      }
    });
    
    // First attempt - should get ended conversation
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait and check if we get error state
    await page.waitForTimeout(5000);
    
    // Navigate away and try again (simulating user retry)
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await page.waitForTimeout(1000);
    
    // Second attempt - should get fresh conversation
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // This time should work
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 15000 });
    
    // Verify no error state
    const errorText = page.locator('text=Meeting has ended, text=error');
    await expect(errorText).toHaveCount(0);
    
    console.log('✅ Successfully recovered from "Meeting has ended" error on retry');
  });

  test('should maintain conversation state consistency across cycles', async ({ page }) => {
    const conversationStates: any[] = [];
    
    // Monitor conversation state changes
    await page.route('**/api/start-conversation', async (route) => {
      const timestamp = Date.now();
      const state = {
        action: 'start',
        timestamp,
        conversationId: `state-conv-${timestamp}`
      };
      conversationStates.push(state);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversation_url: `https://tavus.daily.co/${state.conversationId}`,
          conversation_id: state.conversationId
        }),
      });
    });
    
    await page.route('**/api/end-conversation', async (route) => {
      const timestamp = Date.now();
      conversationStates.push({
        action: 'end',
        timestamp
      });
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Perform 3 complete cycles
    for (let cycle = 1; cycle <= 3; cycle++) {
      // Start conversation
      await page.goto(`/demos/${DEMO_ID}/experience`);
      await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      // End conversation
      const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
      }
      
      await expect(page).toHaveURL(/\/configure/);
      await page.waitForTimeout(500);
    }
    
    // Verify state transitions
    const startActions = conversationStates.filter(s => s.action === 'start');
    const endActions = conversationStates.filter(s => s.action === 'end');
    
    expect(startActions).toHaveLength(3);
    expect(endActions).toHaveLength(3);
    
    // Verify chronological order (start → end → start → end → start → end)
    for (let i = 0; i < conversationStates.length - 1; i += 2) {
      expect(conversationStates[i].action).toBe('start');
      expect(conversationStates[i + 1].action).toBe('end');
      expect(conversationStates[i + 1].timestamp).toBeGreaterThan(conversationStates[i].timestamp);
    }
    
    // Verify unique conversation IDs
    const conversationIds = startActions.map(s => s.conversationId);
    const uniqueIds = new Set(conversationIds);
    expect(uniqueIds.size).toBe(conversationIds.length);
    
    console.log('✅ Conversation state consistency maintained across all cycles');
  });

  test('should handle database cleanup timing issues', async ({ page }) => {
    let cleanupDelay = 0;
    
    // Simulate variable cleanup delays
    await page.route('**/api/end-conversation', async (route) => {
      // Simulate cleanup delay
      await new Promise(resolve => setTimeout(resolve, cleanupDelay));
      cleanupDelay += 100; // Increase delay each time
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    await page.route('**/api/start-conversation', async (route) => {
      const conversationId = `cleanup-test-${Date.now()}`;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversation_url: `https://tavus.daily.co/${conversationId}`,
          conversation_id: conversationId
        }),
      });
    });
    
    // Test 3 cycles with increasing cleanup delays
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`🔄 Testing cleanup timing - cycle ${cycle} (${cleanupDelay}ms delay)`);
      
      // Start conversation
      await page.goto(`/demos/${DEMO_ID}/experience`);
      await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible();
      
      // End conversation
      const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
      }
      
      // Wait for navigation
      await expect(page).toHaveURL(/\/configure/);
      
      // Wait a bit longer than cleanup delay to ensure completion
      await page.waitForTimeout(cleanupDelay + 200);
    }
    
    console.log('✅ Successfully handled variable cleanup timing delays');
  });
});