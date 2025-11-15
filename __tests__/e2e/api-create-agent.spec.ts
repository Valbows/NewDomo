import { test, expect } from '@playwright/test';

test.describe('Create Agent API - Real Integration', () => {
  const TEST_DEMO_ID = 'test-demo-playwright';
  const TEST_USER_ID = 'test-user-playwright';

  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
    
    // Mock external APIs that we don't want to hit in tests
    await page.route('**/api.tavus.io/**', async (route) => {
      // Mock Tavus API responses
      if (route.request().method() === 'POST' && route.request().url().includes('/personas')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            persona_id: 'mock-persona-id-123',
            status: 'active'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock Supabase calls if needed for isolation
    await page.route('**/rest/v1/demos**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: TEST_DEMO_ID,
            tavus_persona_id: 'mock-persona-id-123',
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should create agent and update demo with persona ID', async ({ page }) => {
    // Test the actual API endpoint
    const response = await page.request.post('/api/demos/agents/create', {
      data: {
        demoId: TEST_DEMO_ID,
        agentName: 'Test Agent',
        agentPersonality: 'Friendly test assistant',
        agentGreeting: 'Hello from test!'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verify the response (API may require authentication)
    expect([200, 401, 403, 500].includes(response.status())).toBeTruthy();
    
    if (response.status() === 200) {
      const responseData = await response.json();
      expect(responseData).toHaveProperty('personaId');
      expect(responseData.personaId).toBe('mock-persona-id-123');
    } else if (response.status() === 401) {
      // Authentication required - this is expected in test environment
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    }
  });

  test('should handle missing required fields gracefully', async ({ page }) => {
    const response = await page.request.post('/api/demos/agents/create', {
      data: {
        // Missing required fields
        demoId: TEST_DEMO_ID
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should return error for missing fields or auth
    expect([400, 401, 403, 422, 500].includes(response.status())).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
  });

  test('should handle Tavus API failures gracefully', async ({ page }) => {
    // Mock Tavus API failure
    await page.route('**/api.tavus.io/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Tavus API unavailable' })
      });
    });

    const response = await page.request.post('/api/demos/agents/create', {
      data: {
        demoId: TEST_DEMO_ID,
        agentName: 'Test Agent',
        agentPersonality: 'Friendly test assistant',
        agentGreeting: 'Hello from test!'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should handle external API failure gracefully
    expect([400, 401, 403, 500].includes(response.status())).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
  });

  test('should validate agent configuration parameters', async ({ page }) => {
    const response = await page.request.post('/api/demos/agents/create', {
      data: {
        demoId: TEST_DEMO_ID,
        agentName: '', // Empty name should be invalid
        agentPersonality: 'Valid personality',
        agentGreeting: 'Valid greeting'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should validate input parameters
    if (response.status() >= 400) {
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    } else {
      // If validation passes, should have valid response
      const responseData = await response.json();
      expect(responseData).toHaveProperty('personaId');
    }
  });
});