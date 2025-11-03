/**
 * Integration tests for /api/start-conversation endpoint
 * Tests the fresh conversation creation approach used in main branch
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
// Import the handler function directly to avoid Sentry wrapper issues in tests
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/utils/supabase');
jest.mock('@/lib/sentry-utils');
jest.mock('@/lib/errors');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

const mockCreateClient = jest.fn(() => mockSupabase);
const mockWrapRouteHandlerWithSentry = jest.fn((handler) => handler);
const mockLogError = jest.fn();
const mockGetErrorMessage = jest.fn((error) => error?.message || 'Unknown error');

// Setup mocks
beforeEach(() => {
  const { createClient } = require('@/lib/utils/supabase');
  const { wrapRouteHandlerWithSentry } = require('@/lib/sentry-utils');
  const { logError, getErrorMessage } = require('@/lib/errors');
  
  createClient.mockImplementation(mockCreateClient);
  wrapRouteHandlerWithSentry.mockImplementation(mockWrapRouteHandlerWithSentry);
  logError.mockImplementation(mockLogError);
  getErrorMessage.mockImplementation(mockGetErrorMessage);

  // Reset all mocks
  jest.clearAllMocks();

  // Setup environment variables
  process.env.TAVUS_API_KEY = 'test-api-key';
  process.env.TAVUS_REPLICA_ID = 'test-replica-id';
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  process.env.TAVUS_WEBHOOK_TOKEN = 'test-webhook-token';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('/api/start-conversation Integration Tests', () => {
  const mockUser = { id: 'user-123' };
  const mockDemo = {
    id: 'demo-123',
    user_id: 'user-123',
    tavus_persona_id: 'persona-123',
    tavus_conversation_id: 'old-conv-123',
    metadata: {
      tavusShareableLink: 'https://tavus.daily.co/old-room-123'
    }
  };

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest({ demoId: 'demo-123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Demo Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('should return 400 when demoId is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing demoId');
    });

    it('should return 404 when demo is not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Demo not found' }
      });

      const request = createMockRequest({ demoId: 'nonexistent-demo' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Demo not found or you do not have permission.');
    });

    it('should return 404 when user does not own the demo', async () => {
      const unauthorizedDemo = { ...mockDemo, user_id: 'other-user' };
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: unauthorizedDemo,
        error: null
      });

      const request = createMockRequest({ demoId: 'demo-123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Demo not found or you do not have permission.');
    });

    it('should return 400 when demo has no persona configured', async () => {
      const demoWithoutPersona = { ...mockDemo, tavus_persona_id: null };
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: demoWithoutPersona,
        error: null
      });

      const request = createMockRequest({ demoId: 'demo-123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This demo does not have a configured agent persona.');
    });
  });

  describe('Fresh Conversation Creation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockDemo,
        error: null
      });
    });

    it('should create a new conversation when forceNew is true', async () => {
      // Mock successful Tavus API response
      const mockConversationData = {
        conversation_id: 'new-conv-456',
        conversation_url: 'https://tavus.daily.co/new-room-456',
        status: 'active'
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockConversationData),
        } as any);

      // Mock database update
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: true 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversation_id).toBe('new-conv-456');
      expect(data.conversation_url).toBe('https://tavus.daily.co/new-room-456');

      // Verify Tavus API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://tavusapi.com/v2/conversations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
          },
          body: expect.stringContaining('persona-123'),
        })
      );
    });

    it('should reuse existing conversation if Daily room still exists', async () => {
      // Mock Daily room check to return true (room exists)
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true, // Room exists
        } as any);

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: false 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversation_id).toBe('old-conv-123');
      expect(data.conversation_url).toBe('https://tavus.daily.co/old-room-123');

      // Verify only room check was called, not conversation creation
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://gs.daily.co/rooms/check/tavus/old-room-123'
      );
    });

    it('should create new conversation when existing Daily room is stale', async () => {
      // Mock Daily room check to return false (room doesn't exist)
      // Then mock successful conversation creation
      const mockConversationData = {
        conversation_id: 'new-conv-789',
        conversation_url: 'https://tavus.daily.co/new-room-789',
        status: 'active'
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false, // Room doesn't exist
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockConversationData),
        } as any);

      // Mock database update
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: false 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversation_id).toBe('new-conv-789');
      expect(data.conversation_url).toBe('https://tavus.daily.co/new-room-789');

      // Verify both room check and conversation creation were called
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle Tavus API errors gracefully', async () => {
      // Mock Daily room check to fail
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false, // Room doesn't exist
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ error: 'Invalid persona_id' }),
        } as any);

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: false 
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Failed to start Tavus conversation');
    });

    it('should update demo metadata with new conversation details', async () => {
      const mockConversationData = {
        conversation_id: 'new-conv-update',
        conversation_url: 'https://tavus.daily.co/new-room-update',
        status: 'active'
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockConversationData),
        } as any);

      // Mock database operations
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockDemo, error: null }) // Initial demo fetch
        .mockResolvedValueOnce({ // Current demo fetch for metadata update
          data: { metadata: mockDemo.metadata }, 
          error: null 
        });
      
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: true 
      });
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify database update was called with correct data
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        tavus_conversation_id: 'new-conv-update',
        metadata: expect.objectContaining({
          tavusShareableLink: 'https://tavus.daily.co/new-room-update'
        })
      });
    });
  });

  describe('Environment Configuration', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockDemo,
        error: null
      });
    });

    it('should return 500 when TAVUS_API_KEY is not configured', async () => {
      delete process.env.TAVUS_API_KEY;

      const request = createMockRequest({ demoId: 'demo-123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Tavus API key is not configured.');
    });

    it('should use callback URL with webhook token', async () => {
      const mockConversationData = {
        conversation_id: 'test-conv',
        conversation_url: 'https://tavus.daily.co/test-room',
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockConversationData),
        } as any);

      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      const request = createMockRequest({ 
        demoId: 'demo-123', 
        forceNew: true 
      });
      await POST(request);

      // Verify callback URL includes webhook token
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.callback_url).toBe(
        'http://localhost:3000/api/tavus-webhook?t=test-webhook-token'
      );
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockDemo,
        error: null
      });
    });

    it('should handle concurrent requests with in-memory locking', async () => {
      const mockConversationData = {
        conversation_id: 'concurrent-conv',
        conversation_url: 'https://tavus.daily.co/concurrent-room',
      };

      // Mock slow API response
      global.fetch = jest.fn()
        .mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockConversationData),
            }), 100)
          )
        );

      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      // Make two concurrent requests
      const request1 = createMockRequest({ demoId: 'demo-123', forceNew: true });
      const request2 = createMockRequest({ demoId: 'demo-123', forceNew: false });

      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Should only create one conversation despite concurrent requests
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});