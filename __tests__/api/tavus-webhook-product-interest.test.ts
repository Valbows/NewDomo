/**
 * Tests for product interest tracking in webhook handlers
 * Ensures product interest data is properly stored when objectives complete
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Tavus Webhook - Product Interest Tracking', () => {
  let mockSupabase: any;
  let mockFrom: jest.Mock;
  let mockInsert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
    mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    mockSupabase = {
      from: mockFrom,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Product Interest Data Storage', () => {
    test('should store product interest data with correct schema', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        primary_interest: 'unified platform for workforce planning',
        pain_points: ['data silos', 'manual processes'],
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleProductInterestDiscovery(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      expect(mockFrom).toHaveBeenCalledWith('product_interest_data');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: conversationId,
          objective_name: objectiveName,
          primary_interest: 'unified platform for workforce planning',
          pain_points: ['data silos', 'manual processes'],
          event_type: 'conversation.objective.completed',
          raw_payload: event,
          received_at: expect.any(String),
        })
      );
    });

    test('should handle pain_points as string and convert to array', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        primary_interest: 'organizing and planning',
        pain_points: 'data silos', // String instead of array
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleProductInterestDiscovery(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.pain_points).toEqual(['data silos']);
    });

    test('should handle missing pain_points gracefully', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        primary_interest: 'organizing and planning',
        // No pain_points
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleProductInterestDiscovery(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.pain_points).toBeNull();
    });

    test('should handle missing primary_interest gracefully', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        pain_points: ['data silos'],
        // No primary_interest
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleProductInterestDiscovery(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.primary_interest).toBeNull();
    });

    test('should handle database errors gracefully without throwing', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        primary_interest: 'test',
        pain_points: ['test'],
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '23505' },
      });

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      // Should not throw
      await expect(
        handleProductInterestDiscovery(
          mockSupabase,
          conversationId,
          objectiveName,
          outputVariables,
          event
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Qualification Data Storage (Contact Info)', () => {
    test('should store qualification data with correct schema', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'contact_information_collection';
      const outputVariables = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        position: 'Software Engineer',
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleContactInfoCollection } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleContactInfoCollection(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      expect(mockFrom).toHaveBeenCalledWith('qualification_data');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: conversationId,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          position: 'Software Engineer',
          objective_name: objectiveName,
          event_type: 'conversation.objective.completed',
          raw_payload: event,
          received_at: expect.any(String),
        })
      );
    });

    test('should handle partial contact information', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'greeting_and_qualification';
      const outputVariables = {
        first_name: 'John',
        email: 'john@example.com',
        // Missing last_name and position
      };
      const event = {
        event_type: 'conversation.objective.completed',
      };

      const { handleContactInfoCollection } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleContactInfoCollection(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.first_name).toBe('John');
      expect(insertPayload.email).toBe('john@example.com');
      expect(insertPayload.last_name).toBeNull();
      expect(insertPayload.position).toBeNull();
    });
  });

  describe('Schema Validation - Regression Tests', () => {
    test('REGRESSION CHECK: product_interest_data must have correct columns', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'product_interest_discovery';
      const outputVariables = {
        primary_interest: 'test',
        pain_points: ['test'],
      };
      const event = { event_type: 'conversation.objective.completed' };

      const { handleProductInterestDiscovery } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleProductInterestDiscovery(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];

      // Valid columns
      const expectedKeys = [
        'conversation_id',
        'objective_name',
        'primary_interest',
        'pain_points',
        'event_type',
        'raw_payload',
        'received_at',
      ];

      expectedKeys.forEach((key) => {
        expect(insertPayload).toHaveProperty(key);
      });
    });

    test('REGRESSION CHECK: qualification_data must have correct columns', async () => {
      const conversationId = 'test-conv-123';
      const objectiveName = 'contact_information_collection';
      const outputVariables = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        position: 'Engineer',
      };
      const event = { event_type: 'conversation.objective.completed' };

      const { handleContactInfoCollection } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleContactInfoCollection(
        mockSupabase,
        conversationId,
        objectiveName,
        outputVariables,
        event
      );

      const insertPayload = mockInsert.mock.calls[0][0];

      // Valid columns
      const expectedKeys = [
        'conversation_id',
        'first_name',
        'last_name',
        'email',
        'position',
        'objective_name',
        'event_type',
        'raw_payload',
        'received_at',
      ];

      expectedKeys.forEach((key) => {
        expect(insertPayload).toHaveProperty(key);
      });
    });
  });
});
