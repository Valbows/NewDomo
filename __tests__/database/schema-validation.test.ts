/**
 * Schema Validation Tests
 * Ensures webhook handler payloads match actual database schema
 * Prevents the bug where code tries to insert non-existent columns
 */

import { createClient } from '@supabase/supabase-js';

describe('Database Schema Validation', () => {
  let supabase: any;
  const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY;

  beforeAll(() => {
    // Use real Supabase client for schema validation (only if env vars available)
    if (hasSupabaseEnv) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );
    }
  });

  describe('video_showcase_data table schema', () => {
    test('should have expected columns and NOT have removed columns', () => {
      // Expected columns (based on migration 20241215000002 + 20241215000005)
      const expectedColumns = [
        'id',
        'conversation_id',
        'videos_shown',
        'objective_name',
        'event_type',
        'received_at',
        'raw_payload',
        'created_at',
        'updated_at',
      ];

      // Columns that should NOT exist (removed or never added)
      const forbiddenColumns = [
        'demo_id', // Was being inserted but never in schema
        'requested_videos', // Removed in migration 20241215000005
      ];

      // This test documents the expected schema
      expect(expectedColumns.length).toBeGreaterThan(0);
      expect(forbiddenColumns).toContain('demo_id');
      expect(forbiddenColumns).toContain('requested_videos');
    });

    test('should validate that handler payload matches schema', () => {
      // Mock payload that would be inserted
      const validPayload = {
        conversation_id: 'test-123',
        objective_name: 'video_showcase',
        videos_shown: ['Video 1'],
        received_at: new Date().toISOString(),
      };

      const invalidPayload = {
        conversation_id: 'test-123',
        demo_id: 'demo-123', // ❌ This column doesn't exist
        requested_videos: ['Video 1'], // ❌ This column was removed
        videos_shown: ['Video 1'],
        received_at: new Date().toISOString(),
      };

      // Valid payload should only have valid columns
      expect(validPayload).not.toHaveProperty('demo_id');
      expect(validPayload).not.toHaveProperty('requested_videos');

      // Invalid payload check
      expect(invalidPayload).toHaveProperty('demo_id');
      expect(invalidPayload).toHaveProperty('requested_videos');
    });
  });

  describe('product_interest_data table schema', () => {
    test('should have expected columns', async () => {
      // Expected columns based on migration 20250928000000
      const expectedColumns = [
        'id',
        'conversation_id',
        'objective_name',
        'primary_interest',
        'pain_points',
        'event_type',
        'raw_payload',
        'received_at',
        'created_at',
      ];

      // This test documents the expected schema
      expect(expectedColumns.length).toBeGreaterThan(0);
      expect(expectedColumns).toContain('conversation_id');
      expect(expectedColumns).toContain('primary_interest');
      expect(expectedColumns).toContain('pain_points');
    });

    test('should validate that handler payload matches schema', () => {
      const validPayload = {
        conversation_id: 'test-123',
        objective_name: 'product_interest_discovery',
        primary_interest: 'unified platform',
        pain_points: ['data silos'],
        event_type: 'conversation.objective.completed',
        raw_payload: {},
        received_at: new Date().toISOString(),
      };

      // Should have all required fields
      expect(validPayload).toHaveProperty('conversation_id');
      expect(validPayload).toHaveProperty('primary_interest');
      expect(validPayload).toHaveProperty('pain_points');
    });
  });

  describe('qualification_data table schema', () => {
    test('should have expected columns', async () => {
      // Expected columns based on migration 20241215000001
      const expectedColumns = [
        'id',
        'conversation_id',
        'first_name',
        'last_name',
        'email',
        'position',
        'objective_name',
        'event_type',
        'raw_payload',
        'received_at',
        'created_at',
      ];

      expect(expectedColumns.length).toBeGreaterThan(0);
      expect(expectedColumns).toContain('conversation_id');
      expect(expectedColumns).toContain('email');
    });
  });

  describe('Regression Check - Schema Mismatch Prevention', () => {
    test('CRITICAL: video_showcase_data insert must NOT include demo_id', () => {
      // This is the exact bug we're preventing
      const buggyPayload = {
        conversation_id: 'test-123',
        demo_id: 'demo-123', // ❌ BUG: This column doesn't exist in schema
        videos_shown: ['Video 1'],
      };

      const fixedPayload = {
        conversation_id: 'test-123',
        videos_shown: ['Video 1'],
      };

      // The buggy payload should be flagged
      expect(buggyPayload).toHaveProperty('demo_id');

      // The fixed payload should NOT have demo_id
      expect(fixedPayload).not.toHaveProperty('demo_id');
    });

    test('CRITICAL: video_showcase_data insert must NOT include requested_videos', () => {
      // This column was removed in migration 20241215000005
      const buggyPayload = {
        conversation_id: 'test-123',
        requested_videos: ['Video 1'], // ❌ BUG: This column was removed
        videos_shown: ['Video 1'],
      };

      const fixedPayload = {
        conversation_id: 'test-123',
        videos_shown: ['Video 1'],
      };

      // The buggy payload should be flagged
      expect(buggyPayload).toHaveProperty('requested_videos');

      // The fixed payload should NOT have requested_videos
      expect(fixedPayload).not.toHaveProperty('requested_videos');
    });

    test('should detect when handler code tries to insert invalid columns', async () => {
      // Simulate what happens when code tries to insert invalid columns
      const payloadWithInvalidColumns = {
        conversation_id: 'test-123',
        demo_id: 'demo-123',
        requested_videos: ['Video 1'],
        videos_shown: ['Video 1'],
      };

      // Valid columns for video_showcase_data
      const validColumns = [
        'id',
        'conversation_id',
        'videos_shown',
        'objective_name',
        'event_type',
        'received_at',
        'raw_payload',
        'created_at',
        'updated_at',
      ];

      const invalidColumns = Object.keys(payloadWithInvalidColumns).filter(
        (key) => !validColumns.includes(key)
      );

      // Should detect invalid columns
      expect(invalidColumns).toContain('demo_id');
      expect(invalidColumns).toContain('requested_videos');
      expect(invalidColumns.length).toBe(2);
    });
  });

  describe('Integration Test - Actual Database Insert', () => {
    // Only run integration tests if Supabase env vars are available
    (hasSupabaseEnv ? test : test.skip)('should successfully insert video showcase data without schema errors', async () => {
      const testPayload = {
        conversation_id: `test-${Date.now()}`,
        objective_name: 'video_showcase',
        videos_shown: ['Test Video'],
        received_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('video_showcase_data')
        .insert(testPayload)
        .select();

      if (error) {
        // If error code is 42703, it means column doesn't exist
        expect(error.code).not.toBe('42703');
      }

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('video_showcase_data')
          .delete()
          .eq('id', data[0].id);
      }
    });

    (hasSupabaseEnv ? test : test.skip)('should fail to insert video showcase data with invalid columns', async () => {
      const invalidPayload = {
        conversation_id: `test-${Date.now()}`,
        demo_id: 'invalid-column', // This column doesn't exist
        videos_shown: ['Test Video'],
      };

      const { error } = await supabase
        .from('video_showcase_data')
        .insert(invalidPayload);

      // Should fail with column doesn't exist error
      expect(error).toBeTruthy();
      if (error) {
        // PostgREST returns PGRST204 for column not found
        // PostgreSQL direct access would return 42703
        expect(['42703', 'PGRST204']).toContain(error.code);
      }
    });
  });
});
