/**
 * Unit Tests for Reporting Utilities
 * Tests individual utility functions in isolation
 */

import { describe, it, expect } from '@jest/globals';
import {
  formatDate,
  isValidPerceptionAnalysis,
  calculateConversationStats,
  getConversationDataFlags
} from '@/app/demos/[demoId]/configure/components/reporting/utils';

describe('Reporting Utils Unit Tests', () => {
  describe('formatDate', () => {
    it('should format valid ISO date string', () => {
      const isoDate = '2024-01-01T10:30:00Z';
      const result = formatDate(isoDate);
      expect(result).toMatch(/1\/1\/2024/); // Should contain date parts
    });

    it('should return "—" for undefined input', () => {
      expect(formatDate(undefined)).toBe('—');
    });

    it('should return "—" for null input', () => {
      expect(formatDate(null as any)).toBe('—');
    });

    it('should return "—" for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('—');
    });

    it('should return "—" for empty string', () => {
      expect(formatDate('')).toBe('—');
    });
  });

  describe('isValidPerceptionAnalysis', () => {
    it('should return false for null/undefined', () => {
      expect(isValidPerceptionAnalysis(null)).toBe(false);
      expect(isValidPerceptionAnalysis(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPerceptionAnalysis('')).toBe(false);
      expect(isValidPerceptionAnalysis('   ')).toBe(false);
    });

    it('should return false for black screen indicators', () => {
      expect(isValidPerceptionAnalysis('completely black screen')).toBe(false);
      expect(isValidPerceptionAnalysis('black screen detected')).toBe(false);
      expect(isValidPerceptionAnalysis('no visual content available')).toBe(false);
    });

    it('should return true for valid perception text', () => {
      expect(isValidPerceptionAnalysis('User appears engaged and focused')).toBe(true);
      expect(isValidPerceptionAnalysis('Positive facial expressions observed')).toBe(true);
    });

    it('should return true for object with score properties', () => {
      expect(isValidPerceptionAnalysis({ overall_score: 0.8 })).toBe(true);
      expect(isValidPerceptionAnalysis({ engagement_score: 0.7 })).toBe(true);
    });

    it('should return false for object without score properties', () => {
      expect(isValidPerceptionAnalysis({ random_field: 'value' })).toBe(false);
      expect(isValidPerceptionAnalysis({})).toBe(false);
    });
  });

  describe('calculateConversationStats', () => {
    const mockConversations = [
      {
        id: '1',
        status: 'completed',
        duration_seconds: 300
      },
      {
        id: '2', 
        status: 'ended',
        duration_seconds: 180
      },
      {
        id: '3',
        status: 'active',
        duration_seconds: 0
      },
      {
        id: '4',
        status: 'completed',
        duration_seconds: 240
      }
    ];

    it('should calculate stats correctly', () => {
      const stats = calculateConversationStats(mockConversations);
      
      expect(stats.totalConversations).toBe(4);
      expect(stats.completedConversations).toBe(3); // completed + ended
      expect(stats.averageDuration).toBe(240); // (300 + 180 + 240) / 3
      expect(stats.status).toBe('Active');
    });

    it('should handle empty conversations array', () => {
      const stats = calculateConversationStats([]);
      
      expect(stats.totalConversations).toBe(0);
      expect(stats.completedConversations).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.status).toBe('No Data');
    });

    it('should handle conversations with null duration', () => {
      const conversationsWithNulls = [
        { id: '1', status: 'completed', duration_seconds: null },
        { id: '2', status: 'completed', duration_seconds: 300 }
      ];
      
      const stats = calculateConversationStats(conversationsWithNulls as any);
      
      expect(stats.totalConversations).toBe(2);
      expect(stats.completedConversations).toBe(2);
      expect(stats.averageDuration).toBe(150); // 300 / 2 (null treated as 0)
    });

    it('should handle no completed conversations', () => {
      const activeConversations = [
        { id: '1', status: 'active', duration_seconds: 100 },
        { id: '2', status: 'pending', duration_seconds: 200 }
      ];
      
      const stats = calculateConversationStats(activeConversations);
      
      expect(stats.totalConversations).toBe(2);
      expect(stats.completedConversations).toBe(0);
      expect(stats.averageDuration).toBe(0); // No completed conversations
    });
  });

  describe('getConversationDataFlags', () => {
    const mockContactInfo = {
      'conv-1': { id: '1', conversation_id: 'conv-1', first_name: 'John' }
    };
    
    const mockProductData = {
      'conv-1': { id: '1', conversation_id: 'conv-1', primary_interest: 'Analytics' }
    };
    
    const mockVideoData = {
      'conv-2': { id: '1', conversation_id: 'conv-2', requested_videos: ['Demo'] }
    };
    
    const mockCtaData = {
      'conv-1': { id: '1', conversation_id: 'conv-1', cta_shown_at: '2024-01-01' }
    };

    it('should return correct flags when data exists', () => {
      const flags = getConversationDataFlags(
        'conv-1',
        mockContactInfo,
        mockProductData,
        {},
        mockCtaData,
        'Valid perception analysis'
      );
      
      expect(flags.hasContact).toBe(true);
      expect(flags.hasProductInterest).toBe(true);
      expect(flags.hasVideoShowcase).toBe(false);
      expect(flags.hasCTA).toBe(true);
      expect(flags.hasPerception).toBe(true);
    });

    it('should return false flags when no data exists', () => {
      const flags = getConversationDataFlags(
        'conv-nonexistent',
        {},
        {},
        {},
        {},
        null
      );
      
      expect(flags.hasContact).toBe(false);
      expect(flags.hasProductInterest).toBe(false);
      expect(flags.hasVideoShowcase).toBe(false);
      expect(flags.hasCTA).toBe(false);
      expect(flags.hasPerception).toBe(false);
    });

    it('should handle mixed data availability', () => {
      const flags = getConversationDataFlags(
        'conv-2',
        {},
        {},
        mockVideoData,
        {},
        ''
      );
      
      expect(flags.hasContact).toBe(false);
      expect(flags.hasProductInterest).toBe(false);
      expect(flags.hasVideoShowcase).toBe(true);
      expect(flags.hasCTA).toBe(false);
      expect(flags.hasPerception).toBe(false); // Empty string is falsy
    });
  });
});