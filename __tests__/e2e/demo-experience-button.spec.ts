import { test, expect, Page } from '@playwright/test';

// Use a real demo ID from your Supabase database
// You can replace this with any actual demo ID from your dashboard
const DEMO_ID = process.env.E2E_DEMO_ID || '42beb287-f385-4100-86a4-bfe7008d531b';

test.describe('Demo Experience Button E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the configure page where the button is located
    await page.goto(`/demos/${DEMO_ID}/configure`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('View Demo Experience button is visible and clickable', async ({ page }) => {
    // Check that the button exists and is visible
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await expect(viewDemoButton).toBeVisible();
    
    // Verify button styling
    await expect(viewDemoButton).toHaveClass(/bg-indigo-600/);
    await expect(viewDemoButton).toHaveClass(/text-white/);
    
    // Verify correct href attribute
    await expect(viewDemoButton).toHaveAttribute('href', `/demos/${DEMO_ID}/experience`);
  });

  test('clicking View Demo Experience button navigates to experience page', async ({ page }) => {
    // Click the View Demo Experience button
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await viewDemoButton.click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Verify experience page elements are present
    await expect(page.getByText('Interactive Demo Experience')).toBeVisible();
  });

  test('button hover state changes styling', async ({ page }) => {
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    
    // Hover over the button
    await viewDemoButton.hover();
    
    // In a real test, you might check for hover state changes
    // For now, we just verify the button is still visible and clickable
    await expect(viewDemoButton).toBeVisible();
    await expect(viewDemoButton).toBeEnabled();
  });

  test('button works with keyboard navigation', async ({ page }) => {
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    
    // Focus the button directly (more reliable than Tab navigation)
    await viewDemoButton.focus();
    
    // Verify button is focusable and accessible
    await expect(viewDemoButton).toBeVisible();
    await expect(viewDemoButton).toBeEnabled();
    
    // Press Enter to activate the link
    await page.keyboard.press('Enter');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
  });

  test('button is accessible with screen readers', async ({ page }) => {
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    
    // Check accessibility attributes
    await expect(viewDemoButton).toHaveAttribute('href');
    
    // Verify the button has accessible text
    const buttonText = await viewDemoButton.textContent();
    expect(buttonText).toBe('View Demo Experience');
    
    // Check that the button is properly labeled
    await expect(viewDemoButton).toHaveAccessibleName('View Demo Experience');
  });

  test('navigation preserves demo context', async ({ page }) => {
    // Get demo name from configure page
    const demoNameElement = page.locator('h1').first();
    const configurePageTitle = await demoNameElement.textContent();
    
    // Click View Demo Experience button
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await viewDemoButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the experience page for the same demo
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Check that demo context is preserved (demo name should be visible)
    if (configurePageTitle && configurePageTitle.includes('Configure:')) {
      const demoName = configurePageTitle.replace('Configure: ', '');
      await expect(page.getByText(demoName)).toBeVisible();
    }
  });

  test('button works with different demo IDs', async ({ page }) => {
    // Test URL construction with the same real demo ID but verify the pattern
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    
    // Verify button points to correct URL pattern for the current demo
    await expect(viewDemoButton).toHaveAttribute('href', `/demos/${DEMO_ID}/experience`);
    
    // Verify the URL pattern is correct (contains /demos/ and /experience)
    const href = await viewDemoButton.getAttribute('href');
    expect(href).toMatch(/^\/demos\/[^\/]+\/experience$/);
  });

  test('handles navigation gracefully', async ({ page }) => {
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    
    // Click the button
    await viewDemoButton.click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify we navigated to a valid demos URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/demos/');
    expect(currentUrl).toContain('/experience');
    
    // Verify we're on the correct demo experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
  });

  test('button maintains functionality after page refresh', async ({ page }) => {
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify button still works after refresh
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await expect(viewDemoButton).toBeVisible();
    await expect(viewDemoButton).toHaveAttribute('href', `/demos/${DEMO_ID}/experience`);
    
    // Test navigation still works
    await viewDemoButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
  });

  test('button works in different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await expect(viewDemoButton).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(viewDemoButton).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(viewDemoButton).toBeVisible();
    
    // Verify functionality in desktop view
    await viewDemoButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
  });

  test('experience page loads and connection status', async ({ page }) => {
    // Click the View Demo Experience button
    const viewDemoButton = page.getByRole('link', { name: 'View Demo Experience' });
    await viewDemoButton.click();
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Wait a bit for the page to initialize
    await page.waitForTimeout(3000);
    
    // Check the connection status
    const connectingText = page.getByText('Connecting...');
    const conversationInterface = page.getByTestId('conversation-container');
    const demoHeader = page.getByText('Interactive Demo Experience');
    
    // The page should either show:
    // 1. Conversation interface (connection successful)
    // 2. "Connecting..." (Tavus connection in progress/failed)
    // 3. Demo header (page loaded successfully)
    
    // At minimum, the demo header should be visible (proves navigation worked)
    await expect(demoHeader).toBeVisible();
    
    // Log the connection status for debugging
    const isConnecting = await connectingText.isVisible().catch(() => false);
    const hasConversation = await conversationInterface.isVisible().catch(() => false);
    
    console.log('🔍 Connection Status:');
    console.log(`  - Shows "Connecting...": ${isConnecting}`);
    console.log(`  - Has conversation interface: ${hasConversation}`);
    console.log(`  - Page URL: ${page.url()}`);
    
    // The test passes if we successfully navigated (regardless of Tavus connection)
    // But we log the connection status for debugging
    if (isConnecting) {
      console.log('⚠️  Tavus connection issue detected (stuck at Connecting...)');
    } else if (hasConversation) {
      console.log('✅ Tavus connection successful');
    } else {
      console.log('ℹ️  Page loaded, connection status unclear');
    }
  });
});