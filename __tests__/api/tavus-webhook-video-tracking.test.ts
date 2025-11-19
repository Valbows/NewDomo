/**
 * Tests for video showcase tracking in webhook handlers
 * Prevents regression of the bug where video data wasn't being stored due to schema mismatch
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock broadcast utility
jest.mock('@/app/api/tavus-webhook/utils/broadcast', () => ({
  broadcastToDemo: jest.fn().mockResolvedValue(undefined),
}));

describe('Tavus Webhook - Video Showcase Tracking', () => {
  let mockSupabase: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null });
    mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mockFrom = jest.fn((tableName: string) => {
      // Mock different responses for different tables
      if (tableName === 'demos') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'demo-123' },
                error: null,
              }),
            }),
          }),
        };
      } else if (tableName === 'demo_videos') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { storage_url: 'videos/test.mp4' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      } else if (tableName === 'video_showcase_data') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
    });

    // Mock storage for signed URL
    const mockStorage = {
      from: jest.fn().mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed-url.com/video.mp4' },
          error: null,
        }),
      }),
    };

    mockSupabase = {
      from: mockFrom,
      storage: mockStorage,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Video Showcase Data Storage', () => {
    test('should insert video showcase data with correct schema (no demo_id, no requested_videos)', async () => {
      const conversationId = 'test-conv-123';
      const videoTitle = 'Workforce Planning: Strategic Planning';

      // Set up video_showcase_data mock to return no existing record
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      // Import the handler function (we'll need to export it for testing)
      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, videoTitle);

      // Verify insert was called with correct payload structure
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: conversationId,
          objective_name: 'video_showcase',
          videos_shown: [videoTitle],
          received_at: expect.any(String),
        })
      );

      // Verify DOES NOT include demo_id or requested_videos
      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload).not.toHaveProperty('demo_id');
      expect(insertPayload).not.toHaveProperty('requested_videos');
    });

    test('should update existing video showcase data without adding invalid columns', async () => {
      const conversationId = 'test-conv-123';
      const existingVideos = ['Video 1'];
      const newVideo = 'Video 2';

      // Mock existing showcase
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-id',
          videos_shown: existingVideos,
          objective_name: 'video_showcase',
        },
        error: null,
      });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, newVideo);

      // Verify update was called (not insert)
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();

      // Verify update payload
      const updatePayload = mockUpdate.mock.calls[0][0];
      expect(updatePayload).toHaveProperty('videos_shown');
      expect(updatePayload.videos_shown).toContain('Video 1');
      expect(updatePayload.videos_shown).toContain('Video 2');

      // Verify DOES NOT include invalid columns
      expect(updatePayload).not.toHaveProperty('demo_id');
      expect(updatePayload).not.toHaveProperty('requested_videos');
    });

    test('should accumulate multiple videos in videos_shown array', async () => {
      const conversationId = 'test-conv-123';
      const existingVideos = ['Video 1', 'Video 2'];
      const newVideo = 'Video 3';

      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-id',
          videos_shown: existingVideos,
          objective_name: 'video_showcase',
        },
        error: null,
      });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, newVideo);

      const updatePayload = mockUpdate.mock.calls[0][0];
      expect(updatePayload.videos_shown).toEqual(['Video 1', 'Video 2', 'Video 3']);
    });

    test('should deduplicate videos in videos_shown array', async () => {
      const conversationId = 'test-conv-123';
      const existingVideos = ['Video 1', 'Video 2'];
      const duplicateVideo = 'Video 1'; // Already exists

      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-id',
          videos_shown: existingVideos,
          objective_name: 'video_showcase',
        },
        error: null,
      });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, duplicateVideo);

      const updatePayload = mockUpdate.mock.calls[0][0];
      expect(updatePayload.videos_shown).toEqual(['Video 1', 'Video 2']);
      expect(updatePayload.videos_shown.length).toBe(2); // No duplicate
    });

    test('should handle insert errors gracefully without throwing', async () => {
      const conversationId = 'test-conv-123';
      const videoTitle = 'Test Video';

      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Column does not exist', code: '42703' },
      });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      // Should not throw error
      await expect(handleFetchVideo(mockSupabase, conversationId, videoTitle)).resolves.not.toThrow();
    });
  });

  describe('Schema Validation - Regression Tests', () => {
    test('REGRESSION CHECK: video_showcase_data payload must not include demo_id', async () => {
      const conversationId = 'test-conv-123';
      const videoTitle = 'Test Video';

      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, videoTitle);

      const insertPayload = mockInsert.mock.calls[0][0];

      // This is the bug we're preventing
      expect(insertPayload).not.toHaveProperty('demo_id');
    });

    test('REGRESSION CHECK: video_showcase_data payload must not include requested_videos', async () => {
      const conversationId = 'test-conv-123';
      const videoTitle = 'Test Video';

      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, videoTitle);

      const insertPayload = mockInsert.mock.calls[0][0];

      // This column was removed in migration 20241215000005
      expect(insertPayload).not.toHaveProperty('requested_videos');
    });

    test('REGRESSION CHECK: video_showcase_data payload must match actual schema', async () => {
      const conversationId = 'test-conv-123';
      const videoTitle = 'Test Video';

      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const { handleFetchVideo } = require('@/app/api/tavus-webhook/handlers/toolCallHandlers');

      await handleFetchVideo(mockSupabase, conversationId, videoTitle);

      const insertPayload = mockInsert.mock.calls[0][0];

      // Valid columns only
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

      const payloadKeys = Object.keys(insertPayload);
      payloadKeys.forEach((key) => {
        expect(validColumns).toContain(key);
      });
    });
  });

  describe('Objective Handler - Video Showcase', () => {
    test('should handle demo_video_showcase objective completion without invalid columns', async () => {
      const conversationId = 'test-conv-123';
      const outputVariables = {
        videos_shown: ['Video 1', 'Video 2'],
      };
      const event = {
        event_type: 'conversation.objective.completed',
        properties: { objective_name: 'demo_video_showcase' },
      };

      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const { handleVideoShowcaseObjective } = require('@/app/api/tavus-webhook/handlers/objectiveHandlers');

      await handleVideoShowcaseObjective(mockSupabase, conversationId, outputVariables, event);

      const insertPayload = mockInsert.mock.calls[0][0];

      // Should have correct structure
      expect(insertPayload).toHaveProperty('conversation_id', conversationId);
      expect(insertPayload).toHaveProperty('objective_name', 'demo_video_showcase');
      expect(insertPayload).toHaveProperty('videos_shown');
      expect(insertPayload.videos_shown).toEqual(['Video 1', 'Video 2']);

      // Should NOT have invalid columns
      expect(insertPayload).not.toHaveProperty('demo_id');
      expect(insertPayload).not.toHaveProperty('requested_videos');
    });
  });
});
