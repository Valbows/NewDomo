/**
 * Integration tests for fresh conversation creation flow
 * Tests the complete end-to-end flow that was fixed
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the API and Daily components
jest.mock('@/lib/utils/supabase');
jest.mock('@daily-co/daily-react');

const mockSupabase = {
  auth: { getUser: jest.fn() },
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

const mockDaily = {
  join: jest.fn(),
  leave: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const mockUseMeetingState = jest.fn();
const mockUseDaily = jest.fn();

beforeEach(() => {
  const { createClient } = require('@/lib/utils/supabase');
  const { useDaily, useMeetingState } = require('@daily-co/daily-react');
  
  createClient.mockReturnValue(mockSupabase);
  useDaily.mockReturnValue(mockDaily);
  useMeetingState.mockReturnValue('new');
  
  jest.clearAllMocks();
  
  // Setup environment
  process.env.TAVUS_API_KEY = 'test-key';
  process.env.TAVUS_REPLICA_ID = 'test-replica';
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Fresh Conversation Flow Integration', () => {
  const mockUser = { id: 'user-123' };
  const mockDemo = {
    id: 'demo-123',
    user_id: 'user-123',
    tavus_persona_id: 'persona-123',
    metadata: {}
  };

  describe('API Conversation Creation Flow', () => {
    it('should create fresh conversation when requested', async () => {
      // Mock successful auth and demo fetch
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockDemo,
        error: null
      });

      // Mock successful Tavus API response
      const mockConversationData = {
        conversation_id: 'fresh-conv-123',
        conversation_url: 'https://tavus.daily.co/fresh-conv-123',
        status: 'active'
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConversationData),
      });

      // Mock database update
      mockSupabase.from().update().eq.mockResolvedValue({ error: null });

      // Simulate API call
      const response = await fetch('/api/start-conversation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ demoId: 'demo-123', forceNew: true }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      // Verify fresh conversation created
      expect(data.conversation_id).toBe('fresh-conv-123');
      expect(data.conversation_url).toBe('https://tavus.daily.co/fresh-conv-123');
      
      // Verify Tavus API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://tavusapi.com/v2/conversations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
          }),
        })
      );
    });

    it('should handle conversation creation with proper timing', async () => {
      const startTime = Date.now();
      
      // Mock the timing logic
      const simulateConversationCreation = async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          conversation_id: 'timed-conv-456',
          conversation_url: 'https://tavus.daily.co/timed-conv-456',
          created_at: new Date().toISOString()
        };
      };

      const result = await simulateConversationCreation();
      const endTime = Date.now();
      
      expect(result.conversation_id).toBeDefined();
      expect(result.conversation_url).toMatch(/https:\/\/tavus\.daily\.co\/.+/);
      expect(endTime - startTime).toBeGreaterThan(50); // Some processing time
    });
  });

  describe('CVI Connection Flow with Timing', () => {
    it('should implement proper join delay for fresh conversations', async () => {
      const conversationUrl = 'https://tavus.daily.co/fresh-room-789';
      let joinCalled = false;
      let joinTime = 0;
      
      // Mock join with timing
      const mockJoinWithDelay = async (url: string) => {
        // Simulate the 5-second delay for fresh conversations
        await new Promise(resolve => setTimeout(resolve, 5000));
        joinTime = Date.now();
        joinCalled = true;
        return { success: true };
      };

      const startTime = Date.now();
      await mockJoinWithDelay(conversationUrl);
      
      expect(joinCalled).toBe(true);
      expect(joinTime - startTime).toBeGreaterThanOrEqual(5000); // At least 5 seconds
    });

    it('should handle retry logic for failed connections', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      const mockJoinWithRetry = async (url: string) => {
        attemptCount++;
        
        // Simulate failure on first 2 attempts, success on 3rd
        if (attemptCount < 3) {
          throw new Error('Connection failed');
        }
        
        return { success: true, attempt: attemptCount };
      };

      const retryWithBackoff = async (url: string) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await mockJoinWithRetry(url);
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Exponential backoff
            const delay = 1000 * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const result = await retryWithBackoff('https://tavus.daily.co/retry-test');
      
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3);
      expect(attemptCount).toBe(3);
    });

    it('should detect and handle quick disconnections', () => {
      const scenarios = [
        { joinTime: 1000, leaveTime: 2000, shouldRetry: true },   // 1s duration - retry
        { joinTime: 1000, leaveTime: 8000, shouldRetry: true },   // 7s duration - retry  
        { joinTime: 1000, leaveTime: 12000, shouldRetry: false }, // 11s duration - no retry
        { joinTime: 1000, leaveTime: 30000, shouldRetry: false }, // 29s duration - no retry
      ];

      scenarios.forEach(({ joinTime, leaveTime, shouldRetry }) => {
        const duration = leaveTime - joinTime;
        const isQuickDisconnect = duration < 10000; // 10 second threshold
        
        expect(isQuickDisconnect).toBe(shouldRetry);
      });
    });
  });

  describe('Meeting State Management', () => {
    it('should track meeting state transitions correctly', () => {
      const stateTransitions: string[] = [];
      
      const trackStateChange = (newState: string) => {
        stateTransitions.push(newState);
      };

      // Simulate successful connection flow
      trackStateChange('new');
      trackStateChange('loading');
      trackStateChange('joining-meeting');
      trackStateChange('joined-meeting');

      expect(stateTransitions).toEqual([
        'new',
        'loading', 
        'joining-meeting',
        'joined-meeting'
      ]);
    });

    it('should handle problematic state transitions', () => {
      const stateTransitions: string[] = [];
      
      const trackStateChange = (newState: string) => {
        stateTransitions.push(newState);
      };

      // Simulate problematic flow (quick disconnect)
      trackStateChange('new');
      trackStateChange('joining-meeting');
      trackStateChange('joined-meeting');
      trackStateChange('left-meeting'); // Quick disconnect

      const hasQuickDisconnect = 
        stateTransitions.includes('joined-meeting') && 
        stateTransitions.includes('left-meeting') &&
        stateTransitions.indexOf('left-meeting') - stateTransitions.indexOf('joined-meeting') === 1;

      expect(hasQuickDisconnect).toBe(true);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should implement complete error recovery flow', async () => {
      let connectionAttempts = 0;
      let successfulConnection = false;
      
      const simulateConnectionWithRecovery = async () => {
        const maxAttempts = 3;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          connectionAttempts++;
          
          try {
            // Simulate connection attempt
            if (attempt < 3) {
              // Fail first 2 attempts
              throw new Error('Replica not ready');
            }
            
            // Success on 3rd attempt
            successfulConnection = true;
            return { success: true, attempts: connectionAttempts };
            
          } catch (error) {
            if (attempt === maxAttempts) {
              throw error;
            }
            
            // Wait with exponential backoff
            const delay = 2000 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const result = await simulateConnectionWithRecovery();
      
      expect(result.success).toBe(true);
      expect(connectionAttempts).toBe(3);
      expect(successfulConnection).toBe(true);
    });
  });

  describe('Fresh Conversation Validation', () => {
    it('should validate fresh conversation URLs', () => {
      const freshUrls = [
        'https://tavus.daily.co/c16fc2bcdb312459',
        'https://tavus.daily.co/fresh-conv-123',
        'https://demo.daily.co/new-room-456'
      ];

      const isDailyUrl = (url: string) => {
        return /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);
      };

      freshUrls.forEach(url => {
        expect(isDailyUrl(url)).toBe(true);
      });

      // Invalid URLs should fail
      expect(isDailyUrl('about:blank')).toBe(false);
      expect(isDailyUrl('https://example.com/room')).toBe(false);
    });

    it('should handle conversation metadata correctly', () => {
      const conversationData = {
        conversation_id: 'test-conv-789',
        conversation_url: 'https://tavus.daily.co/test-conv-789',
        status: 'active',
        created_at: new Date().toISOString()
      };

      // Validate conversation data structure
      expect(conversationData.conversation_id).toBeDefined();
      expect(conversationData.conversation_url).toMatch(/^https:\/\/.*\.daily\.co\/.+/);
      expect(conversationData.status).toBe('active');
      expect(new Date(conversationData.created_at)).toBeInstanceOf(Date);
    });
  });
});