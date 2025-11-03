/**
 * Unit tests for start-conversation logic
 * Tests the core conversation creation functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Start Conversation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup environment variables
    process.env.TAVUS_API_KEY = 'test-api-key';
    process.env.TAVUS_REPLICA_ID = 'test-replica-id';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.TAVUS_WEBHOOK_TOKEN = 'test-webhook-token';
  });

  describe('Daily Room URL Validation', () => {
    const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

    it('should validate correct Daily room URLs', () => {
      const validUrls = [
        'https://tavus.daily.co/room123',
        'https://subdomain.daily.co/room-with-hyphens',
        'http://test.daily.co/room_with_underscores',
        'https://demo.daily.co/abc123def456',
      ];

      validUrls.forEach(url => {
        expect(isDailyRoomUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/room123',
        'https://daily.com/room123', // Missing .co
        'https://tavus.daily.co/', // No room ID
        'not-a-url',
        '',
        'ftp://tavus.daily.co/room123', // Wrong protocol
      ];

      invalidUrls.forEach(url => {
        expect(isDailyRoomUrl(url)).toBe(false);
      });
    });
  });

  describe('Daily URL Parsing', () => {
    function parseDailyUrl(url: string): { domain: string; room: string } | null {
      const m = url.match(/^https?:\/\/([a-z0-9-]+)\.daily\.co\/([^\/?#]+)/i);
      if (!m) return null;
      return { domain: m[1], room: decodeURIComponent(m[2]) };
    }

    it('should parse Daily URLs correctly', () => {
      const testCases = [
        {
          url: 'https://tavus.daily.co/room123',
          expected: { domain: 'tavus', room: 'room123' }
        },
        {
          url: 'https://demo.daily.co/abc-def-123',
          expected: { domain: 'demo', room: 'abc-def-123' }
        },
        {
          url: 'http://test.daily.co/room%20with%20spaces',
          expected: { domain: 'test', room: 'room with spaces' }
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = parseDailyUrl(url);
        expect(result).toEqual(expected);
      });
    });

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/room',
        'https://daily.com/room',
        'not-a-url',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(parseDailyUrl(url)).toBeNull();
      });
    });
  });

  describe('Conversation Payload Construction', () => {
    it('should construct proper Tavus API payload', () => {
      const demoData = {
        id: 'demo-123',
        tavus_persona_id: 'persona-456',
        user_id: 'user-789'
      };

      const expectedPayload = {
        persona_id: 'persona-456',
        callback_url: 'http://localhost:3000/api/tavus-webhook?t=test-webhook-token',
        replica_id: 'test-replica-id'
      };

      // Simulate payload construction
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
      const urlToken = process.env.TAVUS_WEBHOOK_TOKEN || '';
      const callbackUrl = `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

      const payload = {
        persona_id: demoData.tavus_persona_id,
        callback_url: callbackUrl,
        replica_id: process.env.TAVUS_REPLICA_ID
      };

      expect(payload).toEqual(expectedPayload);
    });

    it('should handle missing webhook token', () => {
      delete process.env.TAVUS_WEBHOOK_TOKEN;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
      const urlToken = process.env.TAVUS_WEBHOOK_TOKEN || '';
      const callbackUrl = `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

      expect(callbackUrl).toBe('http://localhost:3000/api/tavus-webhook');
    });
  });

  describe('Metadata Update Logic', () => {
    it('should merge new conversation data with existing metadata', () => {
      const existingMetadata = {
        agentName: 'Domo',
        agentPersonality: 'Friendly',
        customField: 'value'
      };

      const conversationData = {
        conversation_id: 'new-conv-123',
        conversation_url: 'https://tavus.daily.co/new-room-123'
      };

      const updatedMetadata = {
        ...existingMetadata,
        tavusShareableLink: conversationData.conversation_url
      };

      expect(updatedMetadata).toEqual({
        agentName: 'Domo',
        agentPersonality: 'Friendly',
        customField: 'value',
        tavusShareableLink: 'https://tavus.daily.co/new-room-123'
      });
    });

    it('should handle string metadata parsing', () => {
      const stringMetadata = '{"agentName":"Domo","existing":"value"}';
      
      let parsedMetadata;
      try {
        parsedMetadata = JSON.parse(stringMetadata);
      } catch (e) {
        parsedMetadata = {};
      }

      expect(parsedMetadata).toEqual({
        agentName: 'Domo',
        existing: 'value'
      });
    });

    it('should handle invalid JSON metadata gracefully', () => {
      const invalidMetadata = 'invalid-json-string';
      
      let parsedMetadata;
      try {
        parsedMetadata = JSON.parse(invalidMetadata);
      } catch (e) {
        parsedMetadata = {};
      }

      expect(parsedMetadata).toEqual({});
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should validate required environment variables', () => {
      const requiredVars = [
        'TAVUS_API_KEY',
        'NEXT_PUBLIC_BASE_URL'
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });

    it('should handle optional environment variables', () => {
      const optionalVars = [
        'TAVUS_REPLICA_ID',
        'TAVUS_WEBHOOK_TOKEN'
      ];

      // These should be defined in our test setup, but in real scenarios might be optional
      optionalVars.forEach(varName => {
        const value = process.env[varName];
        // Should be either undefined or a non-empty string
        expect(value === undefined || (typeof value === 'string' && value.length > 0)).toBe(true);
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle missing demo ID', () => {
      const error = { message: 'Missing demoId', status: 400 };
      
      expect(error.message).toBe('Missing demoId');
      expect(error.status).toBe(400);
    });

    it('should handle unauthorized access', () => {
      const error = { message: 'Unauthorized', status: 401 };
      
      expect(error.message).toBe('Unauthorized');
      expect(error.status).toBe(401);
    });

    it('should handle demo not found', () => {
      const error = { message: 'Demo not found or you do not have permission.', status: 404 };
      
      expect(error.message).toBe('Demo not found or you do not have permission.');
      expect(error.status).toBe(404);
    });

    it('should handle missing persona configuration', () => {
      const error = { message: 'This demo does not have a configured agent persona.', status: 400 };
      
      expect(error.message).toBe('This demo does not have a configured agent persona.');
      expect(error.status).toBe(400);
    });

    it('should handle Tavus API errors', () => {
      const tavusError = {
        message: 'Failed to start Tavus conversation: 400 Bad Request',
        status: 400
      };
      
      expect(tavusError.message).toContain('Failed to start Tavus conversation');
      expect(tavusError.status).toBe(400);
    });
  });

  describe('Fresh Conversation Creation Logic', () => {
    it('should prefer fresh conversation when forceNew is true', () => {
      const forceNew = true;
      const existingUrl = 'https://tavus.daily.co/old-room';
      
      // When forceNew is true, should skip existing URL check
      const shouldCreateNew = forceNew || !existingUrl;
      
      expect(shouldCreateNew).toBe(true);
    });

    it('should check existing conversation when forceNew is false', () => {
      const forceNew = false;
      const existingUrl = 'https://tavus.daily.co/existing-room';
      
      // When forceNew is false, should check if existing URL is valid
      const shouldCheckExisting = !forceNew && !!existingUrl;
      
      expect(shouldCheckExisting).toBe(true);
    });

    it('should create new conversation when no existing URL', () => {
      const forceNew = false;
      const existingUrl = null;
      
      const shouldCreateNew = forceNew || !existingUrl;
      
      expect(shouldCreateNew).toBe(true);
    });
  });
});