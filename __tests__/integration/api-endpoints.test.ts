/**
 * Integration tests for API endpoints
 * Tests the main API functionality that supports the demo experience
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock environment variables
process.env.TAVUS_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('/api/start-conversation', () => {
    it('creates a new conversation successfully', async () => {
      const mockDemo = {
        id: 'test-demo-id',
        name: 'Test Demo',
        tavus_persona_id: 'test-persona-id',
        status: 'active',
      };

      const mockConversationResponse = {
        conversation_id: 'new-conversation-id',
        conversation_url: 'https://tavus.daily.co/new-conversation-id',
      };

      // Mock demo fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDemo,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockDemo,
            error: null,
          }),
        }),
      });

      // Mock Tavus API call
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockConversationResponse),
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { demoId: 'test-demo-id' },
      });

      // Import and test the API route
      const { POST } = await import('@/app/api/start-conversation/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversation_id).toBe('new-conversation-id');
      expect(data.conversation_url).toBe('https://tavus.daily.co/new-conversation-id');
    });

    it('handles missing demo gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Demo not found' },
            }),
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: { demoId: 'nonexistent-demo' },
      });

      const { POST } = await import('@/app/api/start-conversation/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(404);
    });

    it('handles Tavus API errors', async () => {
      const mockDemo = {
        id: 'test-demo-id',
        tavus_persona_id: 'test-persona-id',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDemo,
              error: null,
            }),
          }),
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: 'Invalid persona' }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: { demoId: 'test-demo-id' },
      });

      const { POST } = await import('@/app/api/start-conversation/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(400);
    });
  });

  describe('/api/track-video-view', () => {
    it('tracks video view successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No existing record
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'new-record' },
          error: null,
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          video_title: 'Test Video',
        },
      });

      const { POST } = await import('@/app/api/track-video-view/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('updates existing video view record', async () => {
      const existingRecord = {
        id: 'existing-id',
        videos_shown: ['Existing Video'],
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: existingRecord,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: existingRecord,
            error: null,
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          video_title: 'New Video',
        },
      });

      const { POST } = await import('@/app/api/track-video-view/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('handles missing required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          // Missing demo_id and video_title
        },
      });

      const { POST } = await import('@/app/api/track-video-view/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(400);
    });
  });

  describe('/api/track-cta-click', () => {
    it('tracks CTA click successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No existing record
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'new-record' },
          error: null,
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          cta_url: 'https://example.com',
        },
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const { POST } = await import('@/app/api/track-cta-click/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('updates existing CTA record', async () => {
      const existingRecord = {
        id: 'existing-id',
        cta_url: 'https://example.com',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: existingRecord,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: existingRecord,
            error: null,
          }),
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          cta_url: 'https://example.com',
        },
      });

      const { POST } = await import('@/app/api/track-cta-click/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          conversation_id: 'test-conversation-id',
          demo_id: 'test-demo-id',
          cta_url: 'https://example.com',
        },
      });

      const { POST } = await import('@/app/api/track-cta-click/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(500);
    });
  });

  describe('/api/sync-tavus-conversations', () => {
    it('syncs conversations successfully', async () => {
      const mockDemo = {
        id: 'test-demo-id',
        tavus_conversation_id: 'test-conversation-id',
      };

      const mockTavusResponse = {
        conversation_id: 'test-conversation-id',
        status: 'completed',
        transcript: [
          { speaker: 'user', text: 'Hello' },
          { speaker: 'replica', text: 'Hi there!' },
        ],
        perception_analysis: 'User appears engaged',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDemo,
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({
          data: { id: 'synced-record' },
          error: null,
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTavusResponse),
      });

      const { req } = createMocks({
        method: 'GET',
        query: { demoId: 'test-demo-id' },
      });

      const { GET } = await import('@/app/api/sync-tavus-conversations/route');
      const response = await GET(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('handles missing demo ID', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: {},
      });

      const { GET } = await import('@/app/api/sync-tavus-conversations/route');
      const response = await GET(req as NextRequest);

      expect(response.status).toBe(400);
    });

    it('handles Tavus API errors during sync', async () => {
      const mockDemo = {
        id: 'test-demo-id',
        tavus_conversation_id: 'test-conversation-id',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDemo,
              error: null,
            }),
          }),
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { req } = createMocks({
        method: 'GET',
        query: { demoId: 'test-demo-id' },
      });

      const { GET } = await import('@/app/api/sync-tavus-conversations/route');
      const response = await GET(req as NextRequest);

      expect(response.status).toBe(500);
    });
  });

  describe('/api/tavus-webhook', () => {
    it('processes objective completion webhook', async () => {
      const webhookPayload = {
        event_type: 'conversation.objective.completed',
        conversation_id: 'test-conversation-id',
        properties: {
          objective_name: 'greeting_and_qualification',
          output_variables: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            position: 'Developer',
          },
        },
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: { id: 'new-record' },
          error: null,
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: webhookPayload,
        query: { t: 'test-webhook-token' },
      });

      // Mock environment variable for webhook token
      process.env.TAVUS_WEBHOOK_TOKEN = 'test-webhook-token';

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('processes tool call webhook', async () => {
      const webhookPayload = {
        event_type: 'conversation.tool_call',
        conversation_id: 'test-conversation-id',
        properties: {
          name: 'fetch_video',
          arguments: JSON.stringify({ title: 'Test Video' }),
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { storage_url: 'test-video.mp4' },
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'new-record' },
          error: null,
        }),
      });

      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed-url.com/video.mp4' },
          error: null,
        }),
      });

      const { req } = createMocks({
        method: 'POST',
        body: webhookPayload,
        query: { t: 'test-webhook-token' },
      });

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('rejects unauthorized webhook requests', async () => {
      const webhookPayload = {
        event_type: 'conversation.objective.completed',
        conversation_id: 'test-conversation-id',
      };

      const { req } = createMocks({
        method: 'POST',
        body: webhookPayload,
        query: { t: 'wrong-token' },
      });

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(401);
    });

    it('handles malformed webhook payloads', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid-json',
        query: { t: 'test-webhook-token' },
      });

      const { POST } = await import('@/app/api/tavus-webhook/route');
      const response = await POST(req as NextRequest);

      expect(response.status).toBe(400);
    });
  });
});