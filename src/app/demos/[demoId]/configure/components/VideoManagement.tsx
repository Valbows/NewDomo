import React, { useState } from 'react';
import { Play, Upload, Trash2, AlertCircle, CheckCircle, Clock, Loader2, RotateCcw } from 'lucide-react';
import { DemoVideo, ProcessingStatus } from '@/app/demos/[demoId]/configure/types';

interface VideoManagementProps {
  demoVideos: DemoVideo[];
  processingStatus: ProcessingStatus;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  handleVideoUpload: () => void;
  handlePreviewVideo: (video: DemoVideo) => void;
  handleDeleteVideo: (id: string) => void;
  previewVideoUrl: string | null;
  setPreviewVideoUrl: (url: string | null) => void;
  onRetryTranscription?: (videoId: string) => Promise<void>;
}

export const VideoManagement = ({
  demoVideos,
  processingStatus,
  videoTitle,
  setVideoTitle,
  selectedVideoFile,
  setSelectedVideoFile,
  handleVideoUpload,
  handlePreviewVideo,
  handleDeleteVideo,
  previewVideoUrl,
  setPreviewVideoUrl,
  onRetryTranscription
}: VideoManagementProps) => {
  const [retryingVideoId, setRetryingVideoId] = useState<string | null>(null);

  const handleRetryTranscription = async (videoId: string) => {
    if (!onRetryTranscription) return;
    setRetryingVideoId(videoId);
    try {
      await onRetryTranscription(videoId);
    } finally {
      setRetryingVideoId(null);
    }
  };
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2 font-heading">Video Segments</h2>
      <p className="text-domo-text-secondary mb-6">Upload short video clips that your agent will use in the interactive demo. They will be processed to extract audio for the knowledge base.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video Upload Form */}
        <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl">
          <h3 className="font-medium text-white mb-4">Add New Video</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="video-title" className="block text-sm font-medium text-domo-text-secondary mb-2">Video Title</label>
              <input
                type="text"
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="block w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="e.g., Introduction Clip"
              />
            </div>
            <div>
              <label htmlFor="video-file" className="block text-sm font-medium text-domo-text-secondary mb-2">Video File</label>
              <input
                type="file"
                id="video-file"
                accept="video/*"
                onChange={(e) => setSelectedVideoFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-domo-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-domo-primary/10 file:text-domo-primary hover:file:bg-domo-primary/20"
              />
            </div>
            <button
              onClick={handleVideoUpload}
              disabled={processingStatus.stage === 'uploading' || !videoTitle || !selectedVideoFile}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="-ml-1 mr-2 h-5 w-5" />
              {processingStatus.stage === 'uploading' ? 'Uploading...' : 'Upload Video'}
            </button>
            {processingStatus.stage !== 'idle' && (
              <div className="mt-4 text-sm text-domo-text-secondary">
                <p>{processingStatus.message}</p>
                <div className="w-full bg-domo-bg-dark rounded-full h-2.5 mt-2">
                  <div className="bg-domo-primary h-2.5 rounded-full transition-all" style={{ width: `${processingStatus.progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Video Preview */}
        <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl">
          <h3 className="font-medium text-white mb-4">Preview</h3>
          {previewVideoUrl ? (
            <video key={previewVideoUrl} controls src={previewVideoUrl} className="w-full rounded-lg"></video>
          ) : (
            <div className="text-center text-domo-text-muted py-12">No video selected or available for preview.</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-white mb-4">Uploaded Videos</h3>
        <ul className="space-y-3">
          {demoVideos.map(video => {
            const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
              pending: {
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
                icon: <Clock className="h-4 w-4" />,
                label: 'Pending Transcription',
              },
              processing: {
                color: 'text-domo-primary',
                bg: 'bg-domo-primary/10 border-domo-primary/20',
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                label: 'Transcribing Audio...',
              },
              completed: {
                color: 'text-domo-success',
                bg: 'bg-domo-success/10 border-domo-success/20',
                icon: <CheckCircle className="h-4 w-4" />,
                label: 'Video Ready',
              },
              failed: {
                color: 'text-domo-error',
                bg: 'bg-domo-error/10 border-domo-error/20',
                icon: <AlertCircle className="h-4 w-4" />,
                label: 'Transcription Failed',
              },
            };
            const config = statusConfig[video.processing_status] || statusConfig.pending;

            return (
            <li key={video.id} className={`rounded-xl px-6 py-4 border ${config.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{video.title}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${config.color}`}>
                    {config.icon}
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  {/* Show error details if transcription failed */}
                  {video.processing_status === 'failed' && (
                    <div className="mt-2 p-2 bg-domo-error/20 rounded-lg text-xs text-domo-error">
                      <p className="font-medium">Error Details:</p>
                      <p className="mt-0.5">{video.processing_error || (process.env.NODE_ENV !== 'production' ? 'Unknown error - check ElevenLabs API key' : 'Transcription service unavailable')}</p>
                      <p className="mt-1 text-domo-error/80">Note: Video playback still works. Only audio transcription failed.</p>
                      {onRetryTranscription && (
                        <button
                          onClick={() => handleRetryTranscription(video.id)}
                          disabled={retryingVideoId === video.id}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-domo-error text-white text-xs font-medium rounded-lg hover:bg-domo-error/80 disabled:bg-domo-error/50"
                        >
                          {retryingVideoId === video.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              Retry Transcription
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {/* Show success note for completed */}
                  {video.processing_status === 'completed' && (
                    <p className="mt-1 text-xs text-domo-success">Audio transcribed and added to knowledge base</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handlePreviewVideo(video)}
                    className="px-3 py-1.5 border border-domo-border text-sm font-medium rounded-lg text-domo-text-secondary bg-domo-bg-dark hover:bg-domo-bg-elevated hover:text-white transition-colors"
                    title="Preview video"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-domo-error hover:bg-domo-error/80 transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          );
          })}
          {demoVideos.length === 0 && (
            <li className="bg-domo-bg-card border border-domo-border rounded-xl px-6 py-4">
              <p className="text-center text-sm text-domo-text-muted">No videos have been uploaded yet.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
