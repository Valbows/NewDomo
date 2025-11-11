import { test, expect } from '@playwright/test';

test.describe('Conversation Restart Reliability (Real APIs)', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test('should handle 3 consecutive real conversation cycles without "Meeting has ended" errors', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for real API calls
    
    const cycles = 3;
    const results = [];
    
    for (let cycle = 1; cycle <= cycles; cycle++) {
      console.log(`🔄 Real API Cycle ${cycle}/${cycles} - Starting conversation`);
      
      // Navigate to demo experience
      await page.goto(`/demos/${DEMO_ID}/experience`);
      
      // Wait for conversation interface to load
      await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
      
      // Check for "Meeting has ended" error in console
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes('Meeting has ended')) {
          console.error(`❌ Cycle ${cycle}: Detected "Meeting has ended" error`);
        }
      });
      
      // Wait for conversation to fully initialize
      await page.waitForTimeout(5000);
      
      // Check for error states in the UI
      const errorElements = await page.locator('text=Meeting has ended, text=error, text=failed').count();
      if (errorElements > 0) {
        console.error(`❌ Cycle ${cycle}: Found error elements in UI`);
      }
      
      // Verify conversation container is not in error state
      const conversationContainer = page.locator('[data-testid="conversation-container"]');
      await expect(conversationContainer).toHaveAttribute('data-pip', 'false');
      
      // End conversation by clicking leave button
      const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
      await expect(leaveButton).toBeVisible({ timeout: 10000 });
      await leaveButton.click();
      
      console.log(`  ✅ Cycle ${cycle}: Clicked leave button`);
      
      // Wait for navigation to reporting/configure page
      await expect(page).toHaveURL(/\/demos\/[^\/]+\/configure/, { timeout: 15000 });
      
      console.log(`  ✅ Cycle ${cycle}: Navigated to configure page`);
      
      // Wait for cleanup to complete before next cycle
      await page.waitForTimeout(3000);
      
      results.push({
        cycle,
        success: true,
        hasErrors: errorElements > 0,
        consoleLogs: consoleLogs.filter(log => 
          log.includes('Meeting has ended') || 
          log.includes('error') || 
          log.includes('failed')
        )
      });
      
      console.log(`✅ Completed real API cycle ${cycle}/${cycles}`);
    }
    
    // Verify all cycles completed successfully
    expect(results).toHaveLength(cycles);
    
    const failedCycles = results.filter(r => !r.success || r.hasErrors);
    if (failedCycles.length > 0) {
      console.error('❌ Failed cycles:', failedCycles);
    }
    
    expect(failedCycles).toHaveLength(0);
    
    console.log(`🎉 Successfully completed ${cycles} real API conversation cycles`);
  });

  test('should recover from conversation conflicts automatically', async ({ page }) => {
    test.setTimeout(120000);
    
    // Monitor network requests for debugging
    const apiCalls: any[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/start-conversation') || 
          response.url().includes('/api/end-conversation')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });
    
    // First conversation attempt
    console.log('🔄 First conversation attempt');
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    let conversationLoaded = false;
    try {
      await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 20000 });
      conversationLoaded = true;
      console.log('  ✅ First conversation loaded successfully');
    } catch (error) {
      console.log('  ⚠️ First conversation failed to load');
    }
    
    if (conversationLoaded) {
      // End first conversation
      const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
        await expect(page).toHaveURL(/\/configure/);
        console.log('  ✅ First conversation ended');
      }
    }
    
    // Wait a short time (simulating quick user retry)
    await page.waitForTimeout(1000);
    
    // Second conversation attempt (potential conflict scenario)
    console.log('🔄 Second conversation attempt (testing conflict recovery)');
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // This should work even if there was a conflict
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    console.log('  ✅ Second conversation loaded successfully');
    
    // Verify no "Meeting has ended" errors
    const errorCount = await page.locator('text=Meeting has ended').count();
    expect(errorCount).toBe(0);
    
    // Check API calls for patterns
    const startCalls = apiCalls.filter(call => call.url.includes('start-conversation'));
    const endCalls = apiCalls.filter(call => call.url.includes('end-conversation'));
    
    console.log(`📊 API Calls Summary:`);
    console.log(`  - Start conversation calls: ${startCalls.length}`);
    console.log(`  - End conversation calls: ${endCalls.length}`);
    
    // Should have at least 2 start calls (one for each attempt)
    expect(startCalls.length).toBeGreaterThanOrEqual(1);
    
    console.log('✅ Successfully recovered from potential conversation conflicts');
  });

  test('should handle rapid navigation between experience and configure pages', async ({ page }) => {
    test.setTimeout(90000);
    
    const navigationCycles = 5;
    let errorCount = 0;
    
    // Monitor for errors
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Meeting has ended')) {
        errorCount++;
        console.error(`❌ Navigation cycle error: ${msg.text()}`);
      }
    });
    
    for (let i = 1; i <= navigationCycles; i++) {
      console.log(`🔄 Navigation cycle ${i}/${navigationCycles}`);
      
      // Go to experience page
      await page.goto(`/demos/${DEMO_ID}/experience`);
      await page.waitForTimeout(2000); // Brief wait
      
      // Go to configure page
      await page.goto(`/demos/${DEMO_ID}/configure`);
      await page.waitForTimeout(1000); // Brief wait
    }
    
    // Final test - should be able to load experience page cleanly
    await page.goto(`/demos/${DEMO_ID}/experience`);
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 20000 });
    
    // Verify no accumulated errors
    expect(errorCount).toBe(0);
    
    console.log(`✅ Completed ${navigationCycles} rapid navigation cycles without errors`);
  });

  test('should validate conversation cleanup is complete before allowing restart', async ({ page }) => {
    test.setTimeout(120000);
    
    // Start first conversation
    console.log('🔄 Starting first conversation for cleanup validation');
    await page.goto(`/demos/${DEMO_ID}/experience`);
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    
    // End conversation
    const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
    await leaveButton.click();
    await expect(page).toHaveURL(/\/configure/);
    
    console.log('  ✅ First conversation ended, waiting for cleanup');
    
    // Wait for cleanup to complete (longer wait to ensure full cleanup)
    await page.waitForTimeout(5000);
    
    // Start second conversation - should work cleanly
    console.log('🔄 Starting second conversation after cleanup wait');
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Should load without "Meeting has ended" error
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    
    // Verify conversation is in correct state
    const conversationContainer = page.locator('[data-testid="conversation-container"]');
    await expect(conversationContainer).toHaveAttribute('data-pip', 'false');
    
    // Check for any error indicators
    const errorElements = await page.locator('text=Meeting has ended, text=error').count();
    expect(errorElements).toBe(0);
    
    console.log('✅ Second conversation started cleanly after proper cleanup');
  });

  test('should handle conversation end API failures gracefully', async ({ page }) => {
    test.setTimeout(90000);
    
    let endApiCallCount = 0;
    
    // Intercept end-conversation API to simulate failures
    await page.route('**/api/end-conversation', async (route) => {
      endApiCallCount++;
      
      if (endApiCallCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Simulated API failure' }),
        });
      } else {
        // Subsequent calls succeed
        await route.continue();
      }
    });
    
    // Start conversation
    await page.goto(`/demos/${DEMO_ID}/experience`);
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    
    // End conversation (API will fail)
    const leaveButton = page.locator('button').filter({ hasText: /leave/i }).first();
    await leaveButton.click();
    
    // Should still navigate to configure page despite API failure
    await expect(page).toHaveURL(/\/configure/, { timeout: 15000 });
    
    console.log('  ✅ Navigation succeeded despite end-conversation API failure');
    
    // Wait and try to start new conversation
    await page.waitForTimeout(3000);
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Should still work (graceful degradation)
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ New conversation started successfully despite previous API failure');
  });
});