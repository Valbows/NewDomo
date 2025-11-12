/**
 * End-to-End tests for the reporting functionality
 * Tests the complete reporting and analytics flow
 */

import { test, expect, Page } from '@playwright/test';

const TEST_DEMO_ID = 'test-demo-id';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Mock data
const mockConversationDetails = [
  {
    id: '1',
    tavus_conversation_id: 'conv-1',
    conversation_name: 'Test Conversation 1',
    transcript: [
      { speaker: 'user', text: 'Hello', timestamp: 1000 },
      { speaker: 'replica', text: 'Hi there!', timestamp: 2000 },
    ],
    perception_analysis: 'User appears engaged and attentive throughout the conversation.',
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:05:00Z',
    duration_seconds: 300,
    status: 'completed',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:05:00Z',
  },
  {
    id: '2',
    tavus_conversation_id: 'conv-2',
    conversation_name: 'Test Conversation 2',
    transcript: null,
    perception_analysis: null,
    started_at: '2024-01-01T11:00:00Z',
    completed_at: null,
    duration_seconds: null,
    status: 'active',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
  },
];

const mockContactInfo = [
  {
    id: '1',
    conversation_id: 'conv-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    position: 'Developer',
    received_at: '2024-01-01T10:01:00Z',
  },
];

const mockProductInterest = [
  {
    id: '1',
    conversation_id: 'conv-1',
    primary_interest: 'Workforce Planning',
    pain_points: ['Manual processes', 'Data silos'],
    received_at: '2024-01-01T10:02:00Z',
  },
];

const mockVideoShowcase = [
  {
    id: '1',
    conversation_id: 'conv-1',
    videos_shown: ['Workforce Planning: Headcount and Cost Planning', 'Strategic Planning'],
    objective_name: 'video_showcase',
    received_at: '2024-01-01T10:03:00Z',
  },
];

const mockCtaTracking = [
  {
    id: '1',
    conversation_id: 'conv-1',
    demo_id: TEST_DEMO_ID,
    cta_shown_at: '2024-01-01T10:04:00Z',
    cta_clicked_at: '2024-01-01T10:04:30Z',
    cta_url: 'https://example.com/trial',
  },
];

test.describe('Reporting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock demo data
    await page.route('**/rest/v1/demos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: TEST_DEMO_ID,
          name: 'Test Demo',
          tavus_conversation_id: 'conv-1',
        }),
      });
    });

    // Mock conversation details
    await page.route('**/rest/v1/conversation_details*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockConversationDetails),
      });
    });

    // Mock qualification data
    await page.route('**/rest/v1/qualification_data*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockContactInfo),
      });
    });

    // Mock product interest data
    await page.route('**/rest/v1/product_interest_data*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProductInterest),
      });
    });

    // Mock video showcase data
    await page.route('**/rest/v1/video_showcase_data*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideoShowcase),
      });
    });

    // Mock CTA tracking data
    await page.route('**/rest/v1/cta_tracking*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCtaTracking),
      });
    });

    // Mock sync API
    await page.route('**/api/sync-tavus-conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: [
            {
              conversation_id: 'conv-1',
              has_transcript: true,
              has_perception: true,
            },
          ],
        }),
      });
    });
  });

  test('should load reporting page successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    
    // Navigate to reporting tab
    await page.click('text=Reporting');
    
    // Check that reporting section loads
    await expect(page.locator('text=Reporting & Analytics')).toBeVisible();
    await expect(page.locator('text=View detailed conversation transcripts')).toBeVisible();
  });

  test('should display conversation statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Wait for data to load
    await page.waitForSelector('text=Total Conversations', { timeout: 10000 });
    
    // Check statistics
    await expect(page.locator('text=Total Conversations')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible(); // Total conversations
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Completed conversations
    await expect(page.locator('text=Avg Duration')).toBeVisible();
    await expect(page.locator('text=5:00')).toBeVisible(); // Average duration
  });

  test('should display conversation list', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Wait for conversation list to load
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    
    // Check that conversations are displayed
    await expect(page.locator('text=Test Conversation 1')).toBeVisible();
    await expect(page.locator('text=Test Conversation 2')).toBeVisible();
    
    // Check conversation status badges
    await expect(page.locator('text=completed')).toBeVisible();
    await expect(page.locator('text=active')).toBeVisible();
  });

  test('should expand conversation details', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    
    // Click expand button
    await page.click('text=Expand');
    
    // Check that detailed information is displayed
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();
    await expect(page.locator('text=Developer')).toBeVisible();
  });

  test('should display Domo Score correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Wait for Domo Score to be calculated and displayed
    await page.waitForSelector('text=Domo Score', { timeout: 5000 });
    
    // Check Domo Score display
    await expect(page.locator('text=Domo Score')).toBeVisible();
    await expect(page.locator('text=5/5')).toBeVisible(); // Perfect score
    await expect(page.locator('text=Excellent')).toBeVisible();
    
    // Check score breakdown
    await expect(page.locator('text=Contact Confirmation')).toBeVisible();
    await expect(page.locator('text=Reason Why They Visited Site')).toBeVisible();
    await expect(page.locator('text=Platform Feature Most Interested In')).toBeVisible();
    await expect(page.locator('text=CTA Execution')).toBeVisible();
    await expect(page.locator('text=Visual Analysis')).toBeVisible();
    
    // Check that all items are marked as captured (✅)
    const checkmarks = page.locator('text=✅');
    await expect(checkmarks).toHaveCount(5);
  });

  test('should display contact information card', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check contact information card
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=Captured')).toBeVisible();
    await expect(page.locator('text=Full Name:')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Email:')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();
    await expect(page.locator('text=Position:')).toBeVisible();
    await expect(page.locator('text=Developer')).toBeVisible();
  });

  test('should display product interest card', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check product interest card
    await expect(page.locator('text=Reason Why They Visited Website')).toBeVisible();
    await expect(page.locator('text=Primary Interest:')).toBeVisible();
    await expect(page.locator('text=Workforce Planning')).toBeVisible();
    await expect(page.locator('text=Pain Points:')).toBeVisible();
    await expect(page.locator('text=Manual processes')).toBeVisible();
    await expect(page.locator('text=Data silos')).toBeVisible();
  });

  test('should display video showcase card', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check video showcase card
    await expect(page.locator('text=Website Feature They Are Most Interested in Viewing')).toBeVisible();
    await expect(page.locator('text=Videos Viewed:')).toBeVisible();
    await expect(page.locator('text=Workforce Planning: Headcount and Cost Planning')).toBeVisible();
    await expect(page.locator('text=Strategic Planning')).toBeVisible();
  });

  test('should display CTA tracking card', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check CTA tracking card
    await expect(page.locator('text=Execute CTA?')).toBeVisible();
    await expect(page.locator('text=Yes - Clicked')).toBeVisible();
    await expect(page.locator('text=CTA Shown:')).toBeVisible();
    await expect(page.locator('text=Yes')).toBeVisible();
    await expect(page.locator('text=CTA Clicked:')).toBeVisible();
    await expect(page.locator('text=https://example.com/trial')).toBeVisible();
  });

  test('should display perception analysis', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check perception analysis
    await expect(page.locator('text=Perception Analysis')).toBeVisible();
    await expect(page.locator('text=Visual & Behavioral Analysis')).toBeVisible();
    await expect(page.locator('text=User appears engaged and attentive')).toBeVisible();
  });

  test('should display conversation transcript', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check transcript
    await expect(page.locator('text=Conversation Transcript')).toBeVisible();
    await expect(page.locator('text=user:')).toBeVisible();
    await expect(page.locator('text=Hello')).toBeVisible();
    await expect(page.locator('text=replica:')).toBeVisible();
    await expect(page.locator('text=Hi there!')).toBeVisible();
  });

  test('should handle sync functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Wait for initial load
    await page.waitForSelector('text=Sync from Domo', { timeout: 10000 });
    
    // Click sync button
    await page.click('text=Sync from Domo');
    
    // Check that syncing state is shown
    await expect(page.locator('text=Syncing...')).toBeVisible();
    
    // Wait for sync to complete
    await page.waitForSelector('text=Sync from Domo', { timeout: 10000 });
    
    // Verify that data is refreshed (conversations should still be visible)
    await expect(page.locator('text=Test Conversation 1')).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty data
    await page.route('**/rest/v1/conversation_details*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Check empty state
    await expect(page.locator('text=No detailed conversations found')).toBeVisible();
    await expect(page.locator('text=Start a demo conversation to see analytics here')).toBeVisible();
  });

  test('should handle missing data gracefully', async ({ page }) => {
    // Mock conversation with no additional data
    await page.route('**/rest/v1/qualification_data*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.route('**/rest/v1/product_interest_data*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Test Conversation 1', { timeout: 10000 });
    await page.click('text=Expand');
    
    // Check that missing data is handled gracefully
    await expect(page.locator('text=No contact information captured')).toBeVisible();
    await expect(page.locator('text=No product interest data captured')).toBeVisible();
    
    // Domo Score should reflect missing data
    await expect(page.locator('text=2/5')).toBeVisible(); // Only perception and video data
  });

  test('should calculate average Domo Score correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Wait for statistics to load
    await page.waitForSelector('text=Avg Domo Score', { timeout: 10000 });
    
    // Check average Domo Score
    await expect(page.locator('text=Avg Domo Score')).toBeVisible();
    // With conv-1 having 5/5 and conv-2 having 1/5 (only perception), average should be 3.0
    await expect(page.locator('text=3.0/5')).toBeVisible();
    await expect(page.locator('text=60% Credibility')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/rest/v1/conversation_details*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    // Check that error is displayed
    await expect(page.locator('text=Failed to load conversation details')).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Mock sync API error
    await page.route('**/api/sync-tavus-conversations*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Sync failed' }),
      });
    });
    
    await page.goto(`${BASE_URL}/demos/${TEST_DEMO_ID}/configure`);
    await page.click('text=Reporting');
    
    await page.waitForSelector('text=Sync from Domo', { timeout: 10000 });
    await page.click('text=Sync from Domo');
    
    // Check that sync error is displayed
    await expect(page.locator('text=Failed to sync conversations from Domo')).toBeVisible();
  });
});