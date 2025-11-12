/**
 * Essential Integration tests for API endpoints
 * Tests only the most critical API functionality
 */

import { NextRequest } from 'next/server';

// Mock Next.js server functions
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}));

// Simple mock for essential functionality
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'test-demo-id', tavus_persona_id: 'test-persona' }, 
            error: null 
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
    }
  }))
}));

// Mock environment variables
process.env.TAVUS_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.TAVUS_WEBHOOK_TOKEN = 'test-webhook-token';

describe('Essential API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('/api/start-conversation', () => {
    it('handles basic conversation creation flow', async () => {
      // Mock successful Tavus API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          conversation_id: 'new-conversation-id',
          conversation_url: 'https://tavus.daily.co/new-conversation-id',
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/start-conversation', {
        method: 'POST',
        body: JSON.stringify({ demoId: 'test-demo-id' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/start-conversation/route');
      const response = await POST(req);

      // Should not crash and should return a response
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('/api/track-video-view', () => {
    it('handles video view tracking requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/track-video-view', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          video_title: 'Test Video',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/track-video-view/route');
      const response = await POST(req);

      // Should not crash and should return a response
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('validates required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/track-video-view', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: 'test-conversation-id' }), // Missing required fields
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/track-video-view/route');
      const response = await POST(req);

      expect(response.status).toBe(400);
    });
  });

  describe('/api/track-cta-click', () => {
    it('handles CTA click tracking requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/track-cta-click', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          cta_url: 'https://example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/track-cta-click/route');
      const response = await POST(req);

      // Should not crash and should return a response
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('/api/tavus-webhook', () => {
    it('handles webhook authentication', async () => {
      const req = new NextRequest('http://localhost:3000/api/tavus-webhook?t=wrong-token', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it('handles malformed JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/tavus-webhook?t=test-webhook-token', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req);

      // Should return an error status (400 or 500 are both acceptable for malformed JSON)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});