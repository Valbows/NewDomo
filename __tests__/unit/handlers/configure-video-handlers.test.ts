import { handleVideoUpload, handlePreviewVideo, handleDeleteVideo } from '@/app/demos/[demoId]/configure/handlers/videoHandlers';

// Mock uuid first
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Import after mocking
const { supabase: mockSupabase } = require('@/lib/supabase');

describe('Configure Video Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleVideoUpload', () => {
    it('should validate required fields', async () => {
      const setError = jest.fn();
      const params = {
        selectedVideoFile: null as any,
        videoTitle: '',
        demoId: 'demo1',
        demoVideos: [],
        setProcessingStatus: jest.fn(),
        setError,
        setDemoVideos: jest.fn(),
        setSelectedVideoFile: jest.fn(),
        setVideoTitle: jest.fn(),
      };

      await handleVideoUpload(params);

      expect(setError).toHaveBeenCalledWith('Please select a video file and provide a title.');
    });

    it('should upload video successfully', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const setProcessingStatus = jest.fn();
      const setDemoVideos = jest.fn();
      const setSelectedVideoFile = jest.fn();
      const setVideoTitle = jest.fn();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      const mockStorage = mockSupabase.storage.from('demo-videos');
      (mockStorage.upload as jest.Mock).mockResolvedValue({
        data: { path: 'demo1/test-uuid-123.mp4' },
        error: null,
      });

      const mockFrom = mockSupabase.from('demo_videos');
      const mockInsert = (mockFrom.insert as jest.Mock)();
      const mockSelect = (mockInsert.select as jest.Mock)();
      (mockSelect.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'video1',
          demo_id: 'demo1',
          storage_url: 'demo1/test-uuid-123.mp4',
          title: 'Test Video',
        },
        error: null,
      });

      const params = {
        selectedVideoFile: mockFile,
        videoTitle: 'Test Video',
        demoId: 'demo1',
        demoVideos: [],
        setProcessingStatus,
        setError: jest.fn(),
        setDemoVideos,
        setSelectedVideoFile,
        setVideoTitle,
      };

      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await handleVideoUpload(params);

      expect(setProcessingStatus).toHaveBeenCalledWith({
        stage: 'uploading',
        progress: 0,
        message: 'Uploading video...',
      });
      expect(setProcessingStatus).toHaveBeenCalledWith({
        stage: 'completed',
        progress: 100,
        message: 'Video uploaded. Transcription in progress.',
      });
      expect(setSelectedVideoFile).toHaveBeenCalledWith(null);
      expect(setVideoTitle).toHaveBeenCalledWith('');
    });
  });

  describe('handlePreviewVideo', () => {
    it('should generate signed URL for video preview', async () => {
      const video = {
        id: 'video1',
        storage_url: 'demo1/video.mp4',
        title: 'Test Video',
      };
      const setPreviewVideoUrl = jest.fn();
      const setError = jest.fn();

      const mockStorage = mockSupabase.storage.from('demo-videos');
      (mockStorage.createSignedUrl as jest.Mock).mockResolvedValue({
        data: { signedUrl: 'https://signed-url.example/video.mp4' },
        error: null,
      });

      await handlePreviewVideo(video as any, setPreviewVideoUrl, setError);

      expect(setPreviewVideoUrl).toHaveBeenCalledWith('https://signed-url.example/video.mp4');
      expect(setError).not.toHaveBeenCalled();
    });

    it('should handle preview error', async () => {
      const video = {
        id: 'video1',
        storage_url: 'demo1/video.mp4',
        title: 'Test Video',
      };
      const setPreviewVideoUrl = jest.fn();
      const setError = jest.fn();

      const mockStorage = mockSupabase.storage.from('demo-videos');
      (mockStorage.createSignedUrl as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Failed to create signed URL'),
      });

      await handlePreviewVideo(video as any, setPreviewVideoUrl, setError);

      expect(setPreviewVideoUrl).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalled();
    });
  });

  describe('handleDeleteVideo', () => {
    it('should delete video from storage and database', async () => {
      const demoVideos = [
        { id: 'video1', storage_url: 'demo1/video1.mp4', title: 'Video 1' },
        { id: 'video2', storage_url: 'demo1/video2.mp4', title: 'Video 2' },
      ];
      const setDemoVideos = jest.fn();
      const setError = jest.fn();

      const mockStorage = mockSupabase.storage.from('demo-videos');
      (mockStorage.remove as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      const mockFrom = mockSupabase.from('demo_videos');
      const mockDelete = (mockFrom.delete as jest.Mock)();
      (mockDelete.eq as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await handleDeleteVideo('video1', demoVideos as any, setDemoVideos, setError);

      expect(setDemoVideos).toHaveBeenCalledWith([demoVideos[1]]);
      expect(setError).not.toHaveBeenCalled();
    });

    it('should handle deletion error', async () => {
      const demoVideos = [
        { id: 'video1', storage_url: 'demo1/video1.mp4', title: 'Video 1' },
      ];
      const setDemoVideos = jest.fn();
      const setError = jest.fn();

      const mockStorage = mockSupabase.storage.from('demo-videos');
      (mockStorage.remove as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Storage error'),
      });

      await handleDeleteVideo('video1', demoVideos as any, setDemoVideos, setError);

      expect(setDemoVideos).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalled();
    });

    it('should handle video not found', async () => {
      const demoVideos = [
        { id: 'video1', storage_url: 'demo1/video1.mp4', title: 'Video 1' },
      ];
      const setDemoVideos = jest.fn();
      const setError = jest.fn();

      await handleDeleteVideo('non-existent', demoVideos as any, setDemoVideos, setError);

      expect(setDemoVideos).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();
    });
  });
});
