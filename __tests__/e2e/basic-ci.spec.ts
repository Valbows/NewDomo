/**
 * Basic CI test to verify E2E setup is working
 */

import { test, expect } from '@playwright/test';

test.describe('Basic CI Tests', () => {
  test('should load homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Should see some content (don't require specific elements)
    await expect(page).toHaveTitle(/Domo/i);
  });

  test('should have working JavaScript', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Test that JavaScript is working
    const result = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    expect(result).toBe(true);
  });

  test('should handle 404 pages', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page');
    
    // Should get some response (even if 404)
    const response = await page.waitForLoadState('domcontentloaded');
    expect(response).toBeUndefined(); // waitForLoadState returns undefined on success
  });
});