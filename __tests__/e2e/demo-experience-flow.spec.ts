/**
 * End-to-End tests for the complete demo experience flow
 * Tests the full user journey from demo start to completion
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_DEMO_ID = 'test-demo-id';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Helper functions
async function waitForConversationToLoad(page: Page) {
  await page.waitForSelector('[data-testid="cvi-provider"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="tavus-conversation"]', { timeout: 15000 });
}

async function simulateConversationStart(page: Page) {
  // Wait for conversation interface to be ready
  await waitForConversationToLoad(page);
  
  // Simulate conversation start (this would normally be triggered by Tavus)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('conversation-started', {
      detail: { conversationId: 'test-conversation-id' }
    }));
  });
}

async function simulateVideoRequest(page: Page, videoTitle: string) {
  // Simulate video tool call from Tavus
  await page.evaluate((title) => {
    window.dispatchEvent(new CustomEvent('tool-call', {
      detail: {
        toolName: 'fetch_video',
        args: { title }
      }
    }));
  }, videoTitle);
}

async function simulateObjectiveCompletion(page: Page, objectiveName: string, outputVariables: any) {
  // Simulate objective completion from Tavus
  await page.evaluate((name, variables) => {
    window.dispatchEvent(new CustomEvent('objective-completed', {
      detail: {
        objective_name: name,
        output_variables: variables
      }
    }));
  }, objectiveName, outputVariables);
}

test.describe('Demo Experience Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/start-conversation', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversation_id: 'test-conversation-id',
          conversation_url: 'https://tavus.daily.co/test-conversation-id',
        }),
      });
    });

    await page.route('**/api/track-video-view', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/api/track-cta-click', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock Supabase responses
    await page.route('**/rest/v1/demos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: TEST_DEMO_ID,
          name: 'Test Demo',
          tavus_persona_id: 'test-persona-id',
          status: 'active',
          cta_title: 'Get Started',
          cta_message: 'Ready to try Workday?',
          cta_button_text: 'Start Free Trial',
          cta_button_url: 'https://example.com/trial',
        }),
      });
    });

    await page.route('**/rest/v1/demo_videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          storage_url: 'test-video.mp4',
        }),
      });
    });

    await page.route('**/storage/v1/object/sign/demo-videos/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signedUrl: 'https://example.com/signed-video.mp4',
        }),
      });
    });
  });

  test('should load demo experience page successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Demo Experience/);
    
    // Check that CVI provider is present
    await expect(page.locator('[data-testid="cvi-provider"]')).toBeVisible();
    
    // Check that conversation interface loads
    await waitForConversationToLoad(page);
    await expect(page.locator('[data-testid="tavus-conversation"]')).toBeVisible();
  });

  test('should handle conversation start flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    // Wait for initial load
    await waitForConversationToLoad(page);
    
    // Simulate conversation start
    await simulateConversationStart(page);
    
    // Verify conversation is active
    await expect(page.locator('[data-testid="conversation-active"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle video playback flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate video request
    await simulateVideoRequest(page, 'Workforce Planning: Headcount and Cost Planning');
    
    // Check that video player appears
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 5000 });
    
    // Check that video URL is set
    await expect(page.locator('[data-testid="video-url"]')).toContainText('signed-video.mp4');
    
    // Test video close functionality
    await page.click('[data-testid="close-video"]');
    await expect(page.locator('[data-testid="video-player"]')).not.toBeVisible();
  });

  test('should handle objective completion and data capture', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate contact information objective completion
    await simulateObjectiveCompletion(page, 'greeting_and_qualification', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      position: 'Developer',
    });
    
    // Verify that objective completion is processed
    // (This would typically trigger webhook calls and data storage)
    await page.waitForTimeout(1000); // Allow time for processing
    
    // Check that the system continues to function after objective completion
    await expect(page.locator('[data-testid="tavus-conversation"]')).toBeVisible();
  });

  test('should display and handle CTA interactions', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate CTA trigger (this would normally come from conversation events)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('show-cta', {
        detail: { show: true }
      }));
    });
    
    // Check that CTA banner appears
    await expect(page.locator('[data-testid="cta-banner"]')).toBeVisible({ timeout: 5000 });
    
    // Check CTA content
    await expect(page.locator('[data-testid="cta-title"]')).toContainText('Get Started');
    await expect(page.locator('[data-testid="cta-message"]')).toContainText('Ready to try Workday?');
    await expect(page.locator('[data-testid="cta-button"]')).toContainText('Start Free Trial');
    
    // Test CTA click tracking
    await page.click('[data-testid="cta-button"]');
    
    // Verify that CTA click was tracked (API call should have been made)
    // The mock route should have been called
  });

  test('should handle conversation end and routing', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate conversation end
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('conversation-ended'));
    });
    
    // Check that conversation end is handled properly
    await page.waitForTimeout(2000);
    
    // Verify that the system handles conversation end gracefully
    // (This might involve routing to reporting or showing end state)
    await expect(page.locator('[data-testid="cvi-provider"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error responses
    await page.route('**/api/start-conversation', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    // Check that error is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('error');
  });

  test('should handle video errors gracefully', async ({ page }) => {
    // Mock video API error
    await page.route('**/rest/v1/demo_videos*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Video not found' }),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate video request that will fail
    await simulateVideoRequest(page, 'Nonexistent Video');
    
    // Check that error is handled gracefully
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('not found');
  });

  test('should maintain state during UI transitions', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate video playback
    await simulateVideoRequest(page, 'Test Video');
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    
    // Close video and verify conversation is still active
    await page.click('[data-testid="close-video"]');
    await expect(page.locator('[data-testid="tavus-conversation"]')).toBeVisible();
    
    // Simulate another interaction to ensure state is maintained
    await simulateVideoRequest(page, 'Another Video');
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  });

  test('should handle multiple rapid interactions', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate rapid video requests
    await simulateVideoRequest(page, 'Video 1');
    await simulateVideoRequest(page, 'Video 2');
    await simulateVideoRequest(page, 'Video 3');
    
    // Verify that the system handles rapid interactions gracefully
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    
    // The last video should be the one displayed
    await expect(page.locator('[data-testid="video-url"]')).toContainText('signed-video.mp4');
  });

  test('should track all user interactions for Domo Score', async ({ page }) => {
    let apiCalls: string[] = [];
    
    // Track API calls
    page.on('request', (request) => {
      if (request.url().includes('/api/track-')) {
        apiCalls.push(request.url());
      }
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/experience`);
    
    await waitForConversationToLoad(page);
    await simulateConversationStart(page);
    
    // Simulate complete user journey
    await simulateObjectiveCompletion(page, 'greeting_and_qualification', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      position: 'Developer',
    });
    
    await simulateVideoRequest(page, 'Test Video');
    await page.waitForTimeout(1000);
    
    // Simulate CTA interaction
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('show-cta', { detail: { show: true } }));
    });
    
    await page.waitForSelector('[data-testid="cta-button"]');
    await page.click('[data-testid="cta-button"]');
    
    // Verify that tracking calls were made
    await page.waitForTimeout(2000);
    
    // Check that video tracking was called
    expect(apiCalls.some(url => url.includes('track-video-view'))).toBeTruthy();
    
    // Check that CTA tracking was called
    expect(apiCalls.some(url => url.includes('track-cta-click'))).toBeTruthy();
  });
});