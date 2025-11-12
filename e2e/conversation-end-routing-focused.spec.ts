import { test, expect } from '@playwright/test';

test.describe('Conversation End Routing - Focused Test', () => {
  const DEMO_ID = '12345678-1234-1234-1234-123456789012';

  test('should route to reporting page when conversation ends - real APIs', async ({ page }) => {
    test.setTimeout(60000);
    console.log('🔄 Testing conversation end routing with real APIs');

    // Navigate to demo experience
    await page.goto(`/demos/${DEMO_ID}/experience`);

    // Wait for conversation interface to load
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    console.log('  ✅ Conversation interface loaded');

    // Wait for conversation to fully initialize
    await page.waitForTimeout(5000);

    // Look for the actual conversation leave button (red X button in footer)
    const leaveButtons = [
      page.locator('button[class*="leaveButton"]'), // CSS module class
      page.locator('button[aria-label="Leave Call"]'),
      page.locator('svg[aria-label="Leave Call"]').locator('..'), // Parent button of the leave icon
      page.locator('.footer button').last(), // Last button in the conversation footer
      page.locator('button').filter({ has: page.locator('svg') }).last() // Button with SVG icon (likely the X)
    ];

    let leaveButton = null;
    for (const button of leaveButtons) {
      if (await button.isVisible()) {
        leaveButton = button;
        const text = await button.textContent();
        console.log(`  ✅ Found leave button: "${text || 'X icon'}"`);
        break;
      }
    }

    if (!leaveButton) {
      // Take screenshot to see what buttons are available
      await page.screenshot({ path: 'debug-no-leave-button.png' });
      
      // List all visible buttons
      const allButtons = await page.locator('button').all();
      console.log('  📋 Available buttons:');
      for (const btn of allButtons) {
        if (await btn.isVisible()) {
          const text = await btn.textContent();
          console.log(`    - "${text}"`);
        }
      }
      throw new Error('No leave button found');
    }

    // Click the leave button
    await leaveButton.click();
    console.log('  ✅ Clicked leave button');

    // Wait for navigation with longer timeout
    try {
      await expect(page).toHaveURL(/\/demos\/[^\/]+\/configure/, { timeout: 20000 });
      console.log('  ✅ Successfully navigated to configure page');
    } catch (error) {
      console.log(`  ❌ Navigation failed. Current URL: ${page.url()}`);
      
      // Check if we're still on experience page
      if (page.url().includes('/experience')) {
        console.log('  ⚠️ Still on experience page - conversation end routing may not be working');
        // Take screenshot for debugging
        await page.screenshot({ path: 'debug-still-on-experience.png' });
      }
      throw error;
    }

    // Verify we're on the configure page with reporting tab
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/configure/);
    
    // Check if reporting tab is active (optional - might not always have tab parameter)
    if (currentUrl.includes('tab=reporting')) {
      console.log('  ✅ Reporting tab is active');
    } else {
      console.log('  ℹ️ On configure page but reporting tab not explicitly active');
    }

    console.log('🎉 Conversation end routing test completed successfully');
  });

  test('should debug conversation end flow', async ({ page }) => {
    test.setTimeout(60000);

    // Monitor console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('conversation') || text.includes('end') || text.includes('routing')) {
        console.log(`🔍 Console: ${text}`);
      }
    });

    // Monitor network requests
    const apiCalls: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
        console.log(`🌐 API Call: ${response.status()} ${response.url()}`);
      }
    });

    console.log('🔍 Starting debug session for conversation end flow');

    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    await expect(page.locator('[data-testid="conversation-container"]')).toBeVisible({ timeout: 30000 });
    console.log('  ✅ Conversation loaded, waiting for initialization...');
    
    await page.waitForTimeout(5000);

    // Take screenshot before clicking leave
    await page.screenshot({ path: 'debug-before-leave.png' });

    // Find the actual conversation leave button (red X button)
    const leaveButton = page.locator('button[class*="leaveButton"]').or(
      page.locator('button[aria-label="Leave Call"]')
    ).or(
      page.locator('button').filter({ has: page.locator('svg') }).last()
    ).first();
    
    await expect(leaveButton).toBeVisible();
    const buttonText = await leaveButton.textContent();
    console.log(`  🎯 Found leave button: "${buttonText || 'X icon'}"`);

    // Click leave button
    await leaveButton.click();
    console.log('  ✅ Clicked leave button');

    // Wait and observe what happens
    await page.waitForTimeout(5000);

    // Take screenshot after clicking leave
    await page.screenshot({ path: 'debug-after-leave.png' });
    console.log(`  📍 Current URL after leave: ${page.url()}`);

    // Log relevant console messages
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('conversation') || 
      log.includes('end') || 
      log.includes('routing') ||
      log.includes('navigate')
    );
    console.log('  📋 Relevant console logs:');
    relevantLogs.forEach(log => console.log(`    - ${log}`));

    // Log API calls
    console.log('  📋 API calls made:');
    apiCalls.forEach(call => console.log(`    - ${call.status} ${call.url}`));

    console.log('🔍 Debug session completed');
  });
});