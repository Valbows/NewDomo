/**
 * Integration tests for Twelve Labs Video Understanding
 *
 * Tests the Twelve Labs API integration including:
 * - Index creation/retrieval
 * - Video indexing
 * - Video search
 * - Summary generation
 */

// Disable MSW for this test file since we're testing with our own fetch mocks
let mswServer: any;
try {
  const serverModule = require('../../src/mocks/server');
  mswServer = serverModule.server;
} catch (e) {
  // MSW not available, that's fine
}

// Set environment variable before importing the module
process.env.TWELVE_LABS_API_KEY = 'test-api-key-12345';

describe('Twelve Labs Integration', () => {
  // Store original fetch
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    // Stop MSW server to prevent interference with our fetch mocks
    if (mswServer) {
      mswServer.close();
    }
  });

  afterAll(() => {
    // Restore MSW server
    if (mswServer) {
      mswServer.listen();
    }
    // Restore original fetch
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Create fresh mock for each test
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Clear module cache to reset any cached state
    jest.resetModules();
    process.env.TWELVE_LABS_API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  describe('getOrCreateIndex', () => {
    it('should return existing index ID when index exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { _id: 'existing-index-123', index_name: 'domo-demo-videos' },
            { _id: 'other-index', index_name: 'other-index' },
          ],
        }),
      });

      // Import after setting up mock
      const { getOrCreateIndex } = require('@/lib/twelve-labs');
      const indexId = await getOrCreateIndex();

      expect(indexId).toBe('existing-index-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twelvelabs.io/v1.3/indexes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key-12345',
          }),
        })
      );
    });

    it('should create new index when none exists', async () => {
      // First call returns no matching index
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ _id: 'other-index', index_name: 'other-index' }],
        }),
      });

      // Second call creates the new index
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: 'new-index-456' }),
      });

      const { getOrCreateIndex } = require('@/lib/twelve-labs');
      const indexId = await getOrCreateIndex();

      expect(indexId).toBe('new-index-456');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify POST call to create index
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.twelvelabs.io/v1.3/indexes',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('domo-demo-videos'),
        })
      );
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const { getOrCreateIndex } = require('@/lib/twelve-labs');
      await expect(getOrCreateIndex()).rejects.toThrow('Twelve Labs API error: 500');
    });
  });

  describe('indexVideo', () => {
    it('should start video indexing task', async () => {
      // Mock getOrCreateIndex call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ _id: 'index-123', index_name: 'domo-demo-videos' }],
        }),
      });

      // Mock task creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'task-789',
          video_id: 'video-456',
          status: 'pending',
        }),
      });

      const { indexVideo } = require('@/lib/twelve-labs');
      const result = await indexVideo('https://example.com/video.mp4', 'Test Video');

      expect(result).toEqual({
        indexId: 'index-123',
        videoId: 'video-456',
        taskId: 'task-789',
        status: 'indexing',
      });

      // Verify task creation call
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.twelvelabs.io/v1.3/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            index_id: 'index-123',
            video_url: 'https://example.com/video.mp4',
          }),
        })
      );
    });

    it('should handle missing video_id in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ _id: 'index-123', index_name: 'domo-demo-videos' }],
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'task-789',
          // no video_id
        }),
      });

      const { indexVideo } = require('@/lib/twelve-labs');
      const result = await indexVideo('https://example.com/video.mp4');

      expect(result.videoId).toBe('');
      expect(result.taskId).toBe('task-789');
    });
  });

  describe('getIndexingStatus', () => {
    it('should return task status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ready' }),
      });

      const { getIndexingStatus } = require('@/lib/twelve-labs');
      const status = await getIndexingStatus('task-123');

      expect(status).toBe('ready');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twelvelabs.io/v1.3/tasks/task-123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return unknown for missing status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { getIndexingStatus } = require('@/lib/twelve-labs');
      const status = await getIndexingStatus('task-123');
      expect(status).toBe('unknown');
    });
  });

  describe('searchVideo', () => {
    it('should search video content and return results', async () => {
      // Mock getOrCreateIndex
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ _id: 'index-123', index_name: 'domo-demo-videos' }],
        }),
      });

      // Mock search results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              start: 30,
              end: 45,
              confidence: 0.92,
              metadata: { text: 'User clicks on settings' },
              thumbnail_url: 'https://example.com/thumb1.jpg',
            },
            {
              start: 120,
              end: 135,
              confidence: 0.85,
              transcription: 'Navigate to the settings menu',
            },
          ],
        }),
      });

      const { searchVideo } = require('@/lib/twelve-labs');
      const results = await searchVideo('settings menu');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        start: 30,
        end: 45,
        confidence: 0.92,
        text: 'User clicks on settings',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
      });
      expect(results[1]).toEqual({
        start: 120,
        end: 135,
        confidence: 0.85,
        text: 'Navigate to the settings menu',
        thumbnailUrl: undefined,
      });
    });

    it('should filter by video ID when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { searchVideo } = require('@/lib/twelve-labs');
      await searchVideo('query', 'index-123', 'video-456');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.twelvelabs.io/v1.3/indexes/index-123/search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"filter":{"id":["video-456"]}'),
        })
      );
    });

    it('should return empty array on empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ _id: 'index-123', index_name: 'domo-demo-videos' }],
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // no data field
      });

      const { searchVideo } = require('@/lib/twelve-labs');
      const results = await searchVideo('nonexistent query');
      expect(results).toEqual([]);
    });
  });

  describe('generateVideoSummary', () => {
    it('should generate a video summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: '- Feature A demonstration\n- Settings walkthrough\n- Final review',
        }),
      });

      const { generateVideoSummary } = require('@/lib/twelve-labs');
      const summary = await generateVideoSummary('video-123');

      expect(summary).toBe('- Feature A demonstration\n- Settings walkthrough\n- Final review');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twelvelabs.io/v1.3/summarize',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"video_id":"video-123"'),
        })
      );
    });

    it('should return fallback message when summary is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { generateVideoSummary } = require('@/lib/twelve-labs');
      const summary = await generateVideoSummary('video-123');
      expect(summary).toBe('Unable to generate summary');
    });
  });

  describe('getVideoChapters', () => {
    it('should return video chapters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chapters: [
            { start: 0, end: 60, chapter_title: 'Introduction' },
            { start: 60, end: 180, chapter_summary: 'Main content section' },
            { start: 180, end: 240, chapter_title: 'Conclusion', chapter_summary: 'Wrap up' },
          ],
        }),
      });

      const { getVideoChapters } = require('@/lib/twelve-labs');
      const chapters = await getVideoChapters('video-123');

      expect(chapters).toHaveLength(3);
      expect(chapters[0]).toEqual({
        timestamp: { start: 0, end: 60 },
        description: 'Introduction',
        confidence: 1,
      });
      expect(chapters[1]).toEqual({
        timestamp: { start: 60, end: 180 },
        description: 'Main content section',
        confidence: 1,
      });
      expect(chapters[2]).toEqual({
        timestamp: { start: 180, end: 240 },
        description: 'Conclusion', // chapter_title takes precedence
        confidence: 1,
      });
    });

    it('should return empty array when no chapters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { getVideoChapters } = require('@/lib/twelve-labs');
      const chapters = await getVideoChapters('video-123');
      expect(chapters).toEqual([]);
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const { getVideoChapters } = require('@/lib/twelve-labs');
      const chapters = await getVideoChapters('video-123');
      expect(chapters).toEqual([]);
    });
  });

  describe('buildAgentVideoContext', () => {
    it('should build complete agent context with summary and chapters', async () => {
      // Mock summary call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: 'This video demonstrates the product features.',
        }),
      });

      // Mock chapters call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chapters: [
            { start: 0, end: 60, chapter_title: 'Intro' },
            { start: 60, end: 120, chapter_title: 'Demo' },
          ],
        }),
      });

      const { buildAgentVideoContext } = require('@/lib/twelve-labs');
      const context = await buildAgentVideoContext('video-123');

      expect(context).toContain('## Video Content Overview');
      expect(context).toContain('This video demonstrates the product features.');
      expect(context).toContain('## Video Chapters');
      expect(context).toContain('[0:00 - 1:00] Intro');
      expect(context).toContain('[1:00 - 2:00] Demo');
    });

    it('should return empty string on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { buildAgentVideoContext } = require('@/lib/twelve-labs');
      const context = await buildAgentVideoContext('video-123');
      expect(context).toBe('');
    });
  });
});
