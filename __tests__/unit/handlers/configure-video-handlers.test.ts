import { handleVideoUpload, handlePreviewVideo, handleDeleteVideo } from '@/app/demos/[demoId]/configure/handlers/videoHandlers';

// Mock uuid first
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

// Create mock functions for Supabase
const mockGetUser = jest.fn();
const mockStorageUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockStorageRemove = jest.fn();
const mockStorageFrom = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Get reference to mocked supabase
const { supabase } = require('@/lib/supabase');

describe('Configure Video Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chains
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockEq.mockResolvedValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      delete: mockDelete,
    });
    mockStorageFrom.mockReturnValue({
      upload: mockStorageUpload,
      createSignedUrl: mockCreateSignedUrl,
      remove: mockStorageRemove,
    });

    // Wire up the mocks
    (supabase.auth.getUser as jest.Mock).mockImplementation(mockGetUser);
    (supabase.storage.from as jest.Mock).mockImplementation(mockStorageFrom);
    (supabase.from as jest.Mock).mockImplementation(mockFrom);
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

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      mockStorageUpload.mockResolvedValue({
        data: { path: 'demo1/test-uuid-123.mp4' },
        error: null,
      });

      mockSingle.mockResolvedValue({
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

      mockCreateSignedUrl.mockResolvedValue({
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

      mockCreateSignedUrl.mockResolvedValue({
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

      mockStorageRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      mockEq.mockResolvedValue({
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

      mockStorageRemove.mockResolvedValue({
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
