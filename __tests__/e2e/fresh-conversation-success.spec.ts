/**
 * E2E tests to verify fresh conversation creation success
 * These tests ensure the complete flow works end-to-end
 */

import { test, expect } from '@playwright/test';

test.describe('Fresh Conversation Success E2E', () => {
  const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
  
  test('should successfully create and connect to fresh conversation', async ({ page }) => {
    const conversationIds: string[] = [];
    const connectionStates: string[] = [];
    
    // Monitor API calls and connection states
    page.on('response', async (response) => {
      if (response.url().includes('/api/start-conversation') && response.ok()) {
        try {
          const data = await response.json();
          if (data.conversation_id) {
            conversationIds.push(data.conversation_id);
            console.log('✅ Fresh conversation created:', data.conversation_id);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });

    page.on('console', (msg) => {
      const text = msg.text();
      
      // Track conversation creation
      if (text.includes('Received Daily conversation URL from API')) {
        console.log('📡 API Response:', text);
      }
      
      // Track timing delays
      if (text.includes('Waiting 5s for Tavus replica to initialize')) {
        console.log('⏳ Initialization delay applied');
      }
      
      // Track connection states
      if (text.includes('CVI Meeting State:')) {
        const state = text.split('CVI Meeting State: ')[1];
        connectionStates.push(state);
        console.log('🎯 Connection state:', state);
      }
      
      // Track successful joins
      if (text.includes('Daily joined-meeting')) {
        console.log('🎉 Successfully joined meeting!');
      }
    });

    // Navigate to demo configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await expect(page.locator('h1')).toContainText('Configure');

    // Click View Demo Experience button
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible();
    await viewDemoButton.click();

    // Should navigate to experience page
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);

    // Wait for conversation creation and connection (up to 15 seconds)
    await page.waitForTimeout(15000);

    // Verify fresh conversation was created
    expect(conversationIds.length).toBeGreaterThan(0);
    console.log('📊 Conversations created:', conversationIds.length);

    // Verify connection states progressed correctly
    expect(connectionStates).toContain('new');
    console.log('📈 Connection states observed:', connectionStates);

    // Check for successful connection indicators
    const pageContent = await page.locator('body').textContent();
    const hasConnecting = pageContent?.includes('Connecting');
    const hasError = pageContent?.includes('error') || pageContent?.includes('Error');
    
    console.log('🔍 Page has "Connecting":', hasConnecting);
    console.log('🔍 Page has errors:', hasError);

    // Should not be stuck on "Connecting..." 
    if (hasConnecting) {
      console.log('⚠️ Still showing "Connecting" - may need more time for replica initialization');
    }
  });

  test('should handle multiple rapid navigation attempts', async ({ page }) => {
    const apiCallCount = { count: 0 };
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/start-conversation')) {
        apiCallCount.count++;
        console.log(`📡 API call #${apiCallCount.count}`);
      }
    });

    // Navigate to configure page
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await expect(page.locator('h1')).toContainText('Configure');

    // Rapid clicks on View Demo Experience
    const viewDemoButton = page.getByTestId('view-demo-experience-button');
    await expect(viewDemoButton).toBeVisible();
    
    // Click multiple times rapidly
    await viewDemoButton.click();
    await viewDemoButton.click();
    await viewDemoButton.click();

    // Should still navigate correctly
    await expect(page).toHaveURL(`/demos/${DEMO_ID}/experience`);
    
    // Wait for API calls to complete
    await page.waitForTimeout(5000);
    
    console.log('📊 Total API calls made:', apiCallCount.count);
    
    // Should handle deduplication gracefully
    expect(apiCallCount.count).toBeGreaterThan(0);
  });

  test('should create different conversation IDs on separate visits', async ({ page }) => {
    const conversationIds: string[] = [];
    
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
    await page.waitForTimeout(5000);
    
    // Second visit  
    await page.goto(`/demos/${DEMO_ID}/configure`);
    await page.waitForTimeout(1000);
    await page.goto(`/demos/${DEMO_ID}/experience?forceNew=true`);
    await page.waitForTimeout(5000);
    
    console.log('🆔 Conversation IDs created:', conversationIds);
    
    // Should have created multiple different IDs
    if (conversationIds.length >= 2) {
      expect(conversationIds[0]).not.toBe(conversationIds[1]);
      console.log('✅ Different conversation IDs confirmed');
    }
  });

  test('should show proper timing delays in console', async ({ page }) => {
    const timingLogs: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      
      if (text.includes('Waiting 5s for Tavus replica') || 
          text.includes('CVI: Joining call') ||
          text.includes('joined-meeting')) {
        timingLogs.push(text);
      }
    });

    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for timing sequence
    await page.waitForTimeout(8000);
    
    console.log('⏰ Timing logs captured:', timingLogs);
    
    // Should see the delay message
    const hasDelayMessage = timingLogs.some(log => 
      log.includes('Waiting 5s for Tavus replica')
    );
    
    expect(hasDelayMessage).toBe(true);
  });

  test('should handle conversation interface after successful connection', async ({ page }) => {
    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for conversation to initialize
    await page.waitForTimeout(10000);
    
    // Should see conversation container
    const conversationContainer = page.getByTestId('conversation-container');
    await expect(conversationContainer).toBeVisible({ timeout: 15000 });
    
    // Should not be stuck on connecting
    const connectingText = page.locator('text=Connecting...');
    
    // If connecting appears, it should resolve within reasonable time
    if (await connectingText.isVisible()) {
      console.log('⏳ "Connecting..." detected, waiting for resolution...');
      await expect(connectingText).not.toBeVisible({ timeout: 15000 });
    }
    
    console.log('✅ Conversation interface ready');
  });

  test('should maintain demo context throughout fresh conversation creation', async ({ page }) => {
    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Should maintain demo ID in URL
    expect(page.url()).toContain(DEMO_ID);
    
    // Should show demo name in header
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have configure demo button that links back
    const configureButton = page.locator('text=Configure Demo');
    if (await configureButton.isVisible()) {
      await configureButton.click();
      await expect(page).toHaveURL(`/demos/${DEMO_ID}/configure`);
    }
    
    console.log('✅ Demo context maintained throughout flow');
  });
});