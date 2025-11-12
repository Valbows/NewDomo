import { test, expect } from '@playwright/test';

test.describe('Demo Configuration - Debug', () => {
  const DEMO_ID = '12345678-1234-1234-1234-123456789012';

  test('Debug - Check what is on the configure page', async ({ page }) => {
    test.setTimeout(60000);
    console.log('🔍 Debugging configure page content');

    // Navigate to the configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await page.waitForLoadState('networkidle');
    console.log('  ✅ Page loaded');
    
    // Wait additional time for React hydration
    await page.waitForTimeout(5000);
    console.log('  ✅ Additional wait completed');
    
    // Check if there's a sign-in requirement
    const hasSignIn = await page.locator('text=Sign in').or(page.locator('text=Login')).isVisible().catch(() => false);
    console.log(`  ${hasSignIn ? '🔐' : '✅'} Sign-in required: ${hasSignIn}`);
    
    // Check for any redirect or navigation
    const currentUrl = page.url();
    console.log(`  🌐 Current URL: ${currentUrl}`);
    
    // Try navigating to experience page to see if that works
    console.log('  🔄 Testing experience page...');
    await page.goto(`/demos/${DEMO_ID}/experience`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const experienceContent = await page.locator('body').textContent();
    const experienceLength = experienceContent?.length || 0;
    console.log(`  📝 Experience page content length: ${experienceLength} characters`);
    
    const hasConversation = await page.locator('[data-testid="conversation-container"]').isVisible().catch(() => false);
    console.log(`  ${hasConversation ? '✅' : '❌'} Experience page conversation visible: ${hasConversation}`);
    
    // Go back to configure page
    console.log('  🔄 Going back to configure page...');
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({ path: 'debug-configure-page.png' });
    console.log('  ✅ Screenshot taken');

    // Check what's actually on the page
    const pageTitle = await page.title();
    console.log(`  📄 Page title: ${pageTitle}`);

    // Look for any text that might indicate tabs
    const tabTexts = ['Videos', 'Knowledge Base', 'Agent Settings', 'Call-to-Action', 'Reporting'];
    for (const text of tabTexts) {
      const isVisible = await page.locator(`text=${text}`).isVisible().catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} "${text}" text visible: ${isVisible}`);
    }

    // Check for common tab selectors
    const tabSelectors = [
      'button[value="videos"]',
      '[data-value="videos"]',
      'button:has-text("Videos")',
      '[role="tab"]',
      '.tab',
      '[data-state="active"]'
    ];

    for (const selector of tabSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  📊 Selector "${selector}": ${count} elements found`);
    }

    // Check if there are any buttons at all
    const allButtons = await page.locator('button').count();
    console.log(`  🔘 Total buttons on page: ${allButtons}`);

    // Check if page has loaded properly
    const hasContent = await page.locator('body').textContent();
    const contentLength = hasContent?.length || 0;
    console.log(`  📝 Page content length: ${contentLength} characters`);
    
    // Log first 500 characters of content to see what's actually there
    const contentPreview = hasContent?.substring(0, 500) || '';
    console.log(`  📖 Content preview: ${contentPreview}`);

    // Check for any error messages
    const hasError = await page.locator('text=error').or(page.locator('text=Error')).isVisible().catch(() => false);
    console.log(`  ${hasError ? '❌' : '✅'} Error on page: ${hasError}`);

    // Check for loading states
    const isLoading = await page.locator('text=Loading').or(page.locator('[data-testid="loading"]')).isVisible().catch(() => false);
    console.log(`  ${isLoading ? '⏳' : '✅'} Loading state: ${isLoading}`);

    // Check console logs for errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`❌ Console Error: ${msg.text()}`);
      } else if (msg.text().includes('error') || msg.text().includes('Error')) {
        logs.push(`⚠️ Console: ${msg.text()}`);
      }
    });
    
    // Wait a bit more to catch any console errors
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('  📋 Console errors found:');
      logs.forEach(log => console.log(`    ${log}`));
    } else {
      console.log('  ✅ No console errors found');
    }

    console.log('🎉 Debug completed');
  });
});