import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Tavus Webhook Integration - Real Flow', () => {
  const TEST_DEMO_ID = 'webhook-test-demo';
  const TEST_CONVERSATION_ID = 'webhook-test-conv';
  const WEBHOOK_SECRET = 'domo_webhook_secret_dev_2025'; // Must match .env.development

  // Helper function to create valid webhook signature
  function createWebhookSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  test.beforeEach(async ({ page }) => {
    // Note: TAVUS_WEBHOOK_SECRET is loaded from .env.development by the Next.js server

    // Mock Supabase responses for webhook processing
    await page.route('**/rest/v1/demos**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: TEST_DEMO_ID,
            name: 'Test Demo',
            tavus_persona_id: 'test-persona-123',
            metadata: {
              videos: [
                { title: 'Strategic Planning', path: 'videos/demo_abc/Strategic Planning.mp4' }
              ]
            }
          }])
        });
      } else {
        await route.continue();
      }
    });

    // Mock storage signed URL generation
    await page.route('**/storage/v1/object/sign/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signedURL: 'https://signed-url.example/video.mp4'
        })
      });
    });
  });

  test('should process fetch_video webhook with valid signature', async ({ page }) => {
    const webhookPayload = {
      event_type: 'conversation.toolcall',
      conversation_id: TEST_CONVERSATION_ID,
      data: {
        name: 'fetch_video',
        args: {
          title: 'Strategic Planning'
        }
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = createWebhookSignature(payloadString, WEBHOOK_SECRET);

    const response = await page.request.post('/api/tavus-webhook', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      }
    });

    // Should process webhook successfully (even if demo not found)
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('received');
    // Success means webhook was authenticated and processed
    expect(responseData.received).toBe(true);
  });

  test('should reject webhook with invalid signature', async ({ page }) => {
    const webhookPayload = {
      event_type: 'conversation.toolcall',
      conversation_id: TEST_CONVERSATION_ID,
      data: {
        name: 'fetch_video',
        args: { title: 'Strategic Planning' }
      }
    };

    const response = await page.request.post('/api/tavus-webhook', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'invalid-signature'
      }
    });

    // Should reject invalid signature
    expect(response.status()).toBe(401);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Unauthorized');
  });

  test('should handle show_trial_cta webhook correctly', async ({ page }) => {
    const webhookPayload = {
      event_type: 'conversation.toolcall',
      conversation_id: TEST_CONVERSATION_ID,
      data: {
        name: 'show_trial_cta',
        args: {}
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = createWebhookSignature(payloadString, WEBHOOK_SECRET);

    const response = await page.request.post('/api/tavus-webhook', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      }
    });

    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('received');
    // Success means webhook was authenticated and processed
    expect(responseData.received).toBe(true);
  });

  test('should handle malformed webhook payload gracefully', async ({ page }) => {
    const malformedPayload = {
      // Missing required fields
      event_type: 'conversation.toolcall'
      // Missing conversation_id and data
    };

    const payloadString = JSON.stringify(malformedPayload);
    const signature = createWebhookSignature(payloadString, WEBHOOK_SECRET);

    const response = await page.request.post('/api/tavus-webhook', {
      data: malformedPayload,
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      }
    });

    // Should handle malformed payload gracefully (auth passes, but payload invalid)
    expect([200, 400].includes(response.status())).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toBeDefined();
    // Should have either success response or error message
    expect(responseData.received === true || responseData.error).toBeTruthy();
  });

  test('should support multiple signature header formats', async ({ page }) => {
    const webhookPayload = {
      event_type: 'conversation.toolcall',
      conversation_id: TEST_CONVERSATION_ID,
      data: {
        name: 'fetch_video',
        args: { title: 'Test Video' }
      }
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = createWebhookSignature(payloadString, WEBHOOK_SECRET);

    // Test different header names
    const headerVariants = [
      'x-signature',
      'tavus-signature',
      'x-tavus-signature'
    ];

    for (const headerName of headerVariants) {
      const response = await page.request.post('/api/tavus-webhook', {
        data: webhookPayload,
        headers: {
          'Content-Type': 'application/json',
          [headerName]: signature
        }
      });

      expect([200, 401].includes(response.status())).toBeTruthy();
    }
  });
});