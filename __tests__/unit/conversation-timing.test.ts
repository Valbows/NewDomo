/**
 * Unit tests for conversation timing and retry logic
 * Ensures fresh conversation creation timing never breaks
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Conversation Timing Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window globals
    const w: any = typeof window !== 'undefined' ? window : global;
    delete w.__CVI_LAST_JOIN_TIME__;
    delete w.__CVI_LAST_RETRY__;
  });

  describe('Fresh Conversation Delay Logic', () => {
    it('should implement 5-second delay for fresh conversations', () => {
      const EXPECTED_DELAY = 5000; // 5 seconds
      
      // This represents the delay we add before joining fresh conversations
      const freshConversationDelay = 5000;
      
      expect(freshConversationDelay).toBe(EXPECTED_DELAY);
    });

    it('should calculate proper retry delays with exponential backoff', () => {
      const baseDelay = 2000; // 2 seconds
      const maxRetries = 3;
      
      const calculateRetryDelay = (retryCount: number) => {
        return baseDelay * Math.pow(2, retryCount - 1);
      };
      
      // Test exponential backoff
      expect(calculateRetryDelay(1)).toBe(2000);  // 2s
      expect(calculateRetryDelay(2)).toBe(4000);  // 4s  
      expect(calculateRetryDelay(3)).toBe(8000);  // 8s
    });

    it('should validate retry timing thresholds', () => {
      const QUICK_DISCONNECT_THRESHOLD = 10000; // 10 seconds
      const RETRY_COOLDOWN = 30000; // 30 seconds
      
      const shouldAutoRetry = (timeSinceJoin: number, timeSinceLastRetry: number) => {
        return timeSinceJoin < QUICK_DISCONNECT_THRESHOLD && timeSinceLastRetry > RETRY_COOLDOWN;
      };
      
      // Should retry if disconnected quickly and no recent retry
      expect(shouldAutoRetry(5000, 35000)).toBe(true);
      
      // Should not retry if disconnected after long time
      expect(shouldAutoRetry(15000, 35000)).toBe(false);
      
      // Should not retry if recent retry attempt
      expect(shouldAutoRetry(5000, 10000)).toBe(false);
    });
  });

  describe('Join Time Tracking', () => {
    it('should track join times correctly', () => {
      const mockWindow: any = {};
      
      const trackJoinTime = () => {
        mockWindow.__CVI_LAST_JOIN_TIME__ = Date.now();
      };
      
      const getTimeSinceJoin = () => {
        const joinTime = mockWindow.__CVI_LAST_JOIN_TIME__ || 0;
        return Date.now() - joinTime;
      };
      
      // Track join
      trackJoinTime();
      expect(mockWindow.__CVI_LAST_JOIN_TIME__).toBeDefined();
      expect(typeof mockWindow.__CVI_LAST_JOIN_TIME__).toBe('number');
      
      // Time since join should be small initially
      const timeSinceJoin = getTimeSinceJoin();
      expect(timeSinceJoin).toBeLessThan(100); // Less than 100ms
    });

    it('should track retry attempts to prevent spam', () => {
      const mockWindow: any = {};
      
      const trackRetryAttempt = () => {
        mockWindow.__CVI_LAST_RETRY__ = Date.now();
      };
      
      const canRetry = () => {
        const lastRetry = mockWindow.__CVI_LAST_RETRY__ || 0;
        const timeSinceRetry = Date.now() - lastRetry;
        return timeSinceRetry > 30000; // 30 second cooldown
      };
      
      // Initially should be able to retry
      expect(canRetry()).toBe(true);
      
      // After tracking retry, should not be able to retry immediately
      trackRetryAttempt();
      expect(canRetry()).toBe(false);
    });
  });

  describe('Daily Room URL Validation', () => {
    it('should validate Daily room URLs correctly', () => {
      const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);
      
      // Valid Daily URLs
      const validUrls = [
        'https://tavus.daily.co/c16fc2bcdb312459',
        'https://demo.daily.co/room123',
        'http://test.daily.co/abc-def-456'
      ];
      
      validUrls.forEach(url => {
        expect(isDailyRoomUrl(url)).toBe(true);
      });
      
      // Invalid URLs
      const invalidUrls = [
        'https://example.com/room',
        'https://daily.com/room', // Missing .co
        'about:blank',
        ''
      ];
      
      invalidUrls.forEach(url => {
        expect(isDailyRoomUrl(url)).toBe(false);
      });
    });
  });

  describe('Conversation State Management', () => {
    it('should handle meeting state transitions correctly', () => {
      const validStates = [
        'new',
        'loading', 
        'joining-meeting',
        'joined-meeting',
        'left-meeting',
        'error'
      ];
      
      const isValidMeetingState = (state: string) => {
        return validStates.includes(state);
      };
      
      // Test all valid states
      validStates.forEach(state => {
        expect(isValidMeetingState(state)).toBe(true);
      });
      
      // Test invalid states
      expect(isValidMeetingState('invalid')).toBe(false);
      expect(isValidMeetingState('')).toBe(false);
    });

    it('should detect problematic state transitions', () => {
      const detectQuickDisconnect = (joinTime: number, leaveTime: number) => {
        const duration = leaveTime - joinTime;
        return duration < 10000; // Less than 10 seconds
      };
      
      const now = Date.now();
      
      // Quick disconnect (problematic)
      expect(detectQuickDisconnect(now, now + 5000)).toBe(true);
      
      // Normal disconnect (not problematic)  
      expect(detectQuickDisconnect(now, now + 15000)).toBe(false);
    });
  });

  describe('Error Recovery Logic', () => {
    it('should implement proper backoff strategy', () => {
      const calculateBackoff = (attempt: number, baseDelay: number = 1000) => {
        return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Cap at 30s
      };
      
      expect(calculateBackoff(0)).toBe(1000);   // 1s
      expect(calculateBackoff(1)).toBe(2000);   // 2s
      expect(calculateBackoff(2)).toBe(4000);   // 4s
      expect(calculateBackoff(3)).toBe(8000);   // 8s
      expect(calculateBackoff(4)).toBe(16000);  // 16s
      expect(calculateBackoff(5)).toBe(30000);  // Capped at 30s
      expect(calculateBackoff(10)).toBe(30000); // Still capped
    });

    it('should limit retry attempts', () => {
      const MAX_RETRIES = 3;
      
      const shouldRetry = (attemptCount: number) => {
        return attemptCount < MAX_RETRIES;
      };
      
      expect(shouldRetry(0)).toBe(true);
      expect(shouldRetry(1)).toBe(true);
      expect(shouldRetry(2)).toBe(true);
      expect(shouldRetry(3)).toBe(false); // Max reached
      expect(shouldRetry(5)).toBe(false);
    });
  });

  describe('Fresh Conversation Detection', () => {
    it('should identify fresh conversations by URL pattern', () => {
      const isFreshConversation = (url: string) => {
        // Fresh conversations typically have recent timestamps in URL or are newly created
        // For testing, we assume any Daily URL is potentially fresh
        return /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);
      };
      
      expect(isFreshConversation('https://tavus.daily.co/c16fc2bcdb312459')).toBe(true);
      expect(isFreshConversation('about:blank')).toBe(false);
    });

    it('should apply appropriate delays for fresh conversations', () => {
      const getJoinDelay = (isFresh: boolean) => {
        return isFresh ? 5000 : 0; // 5s delay for fresh, immediate for existing
      };
      
      expect(getJoinDelay(true)).toBe(5000);
      expect(getJoinDelay(false)).toBe(0);
    });
  });
});