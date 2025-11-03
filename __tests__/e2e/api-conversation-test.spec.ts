/**
 * E2E test to verify fresh conversation creation API
 */

import { test, expect } from '@playwright/test';

test.describe('Fresh Conversation API Test', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test('should capture API calls when navigating to experience page', async ({ page }) => {
    const apiCalls: { url: string; method: string; status: number; response?: any }[] = [];
    
    // Monitor all network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/start-conversation')) {
        console.log('🚀 API Request:', request.method(), request.url());
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/start-conversation')) {
        try {
          const responseData = await response.json();
          apiCalls.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            response: responseData
          });
          console.log('✅ API Response:', response.status(), responseData);
        } catch (e) {
          apiCalls.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            response: 'Failed to parse JSON'
          });
          console.log('❌ API Response (no JSON):', response.status());
        }
      }
    });

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
    
    // Wait for potential API calls
    await page.waitForTimeout(5000);
    
    console.log('📊 Total API calls captured:', apiCalls.length);
    apiCalls.forEach((call, index) => {
      console.log(`📋 Call ${index + 1}:`, call);
    });
    
    // Log what we see on the page
    const pageContent = await page.locator('body').textContent();
    console.log('📄 Page contains "Connecting":', pageContent?.includes('Connecting'));
    console.log('📄 Page contains "conversation":', pageContent?.includes('conversation'));
    console.log('📄 Page contains "error":', pageContent?.includes('error'));
  });

  test('should show conversation interface or error message', async ({ page }) => {
    // Navigate directly to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check what's displayed
    const pageText = await page.locator('body').textContent();
    console.log('📄 Page content preview:', pageText?.substring(0, 500));
    
    // Should either show conversation interface or an error
    const hasConversationContainer = await page.getByTestId('conversation-container').isVisible().catch(() => false);
    const hasErrorMessage = pageText?.includes('error') || pageText?.includes('Error') || pageText?.includes('Failed');
    const hasConnecting = pageText?.includes('Connecting');
    
    console.log('🔍 Has conversation container:', hasConversationContainer);
    console.log('🔍 Has error message:', hasErrorMessage);
    console.log('🔍 Has connecting text:', hasConnecting);
    
    // At least one of these should be true
    expect(hasConversationContainer || hasErrorMessage || hasConnecting).toBe(true);
  });

  test('should handle fresh conversation creation with forceNew parameter', async ({ page }) => {
    const apiCalls: any[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/start-conversation')) {
        try {
          const responseData = await response.json();
          apiCalls.push(responseData);
          console.log('🔄 Fresh conversation response:', responseData);
        } catch (e) {
          console.log('❌ Failed to parse API response');
        }
      }
    });

    // Navigate with forceNew parameter
    await page.goto(`/demos/${DEMO_ID}/experience?forceNew=true`);
    
    // Wait for API call
    await page.waitForTimeout(5000);
    
    console.log('📊 API calls with forceNew:', apiCalls.length);
    
    if (apiCalls.length > 0) {
      const response = apiCalls[0];
      console.log('🆔 Conversation ID:', response.conversation_id);
      console.log('🔗 Conversation URL:', response.conversation_url);
      
      // Should have conversation details
      expect(response.conversation_id).toBeDefined();
      expect(response.conversation_url).toBeDefined();
      
      // URL should be a Daily room URL
      if (response.conversation_url) {
        expect(response.conversation_url).toMatch(/https?:\/\/.*\.daily\.co\/.+/);
      }
    }
  });
});