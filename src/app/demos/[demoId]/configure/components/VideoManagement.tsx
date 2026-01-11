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
      <h2 className="text-xl font-semibold mb-4">Video Segments</h2>
      <p className="text-gray-600 mb-6">Upload short video clips that your agent will use in the interactive demo. They will be processed to extract audio for the knowledge base.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium mb-4">Add New Video</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="video-title" className="block text-sm font-medium text-gray-700">Video Title</label>
              <input
                type="text"
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Introduction Clip"
              />
            </div>
            <div>
              <label htmlFor="video-file" className="block text-sm font-medium text-gray-700">Video File</label>
              <input
                type="file"
                id="video-file"
                accept="video/*"
                onChange={(e) => setSelectedVideoFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
              />
            </div>
            <button
              onClick={handleVideoUpload}
              disabled={processingStatus.stage === 'uploading' || !videoTitle || !selectedVideoFile}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              <Upload className="-ml-1 mr-2 h-5 w-5" />
              {processingStatus.stage === 'uploading' ? 'Uploading...' : 'Upload Video'}
            </button>
            {processingStatus.stage !== 'idle' && (
              <div className="mt-4 text-sm text-gray-600">
                <p>{processingStatus.message}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${processingStatus.progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Video Preview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium mb-4">Preview</h3>
          {previewVideoUrl ? (
            <video key={previewVideoUrl} controls src={previewVideoUrl} className="w-full rounded-md"></video>
          ) : (
            <div className="text-center text-gray-500">No video selected or available for preview.</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Uploaded Videos</h3>
        <ul className="mt-4 space-y-3">
          {demoVideos.map(video => {
            const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
              pending: {
                color: 'text-amber-600',
                bg: 'bg-amber-50 border-amber-200',
                icon: <Clock className="h-4 w-4" />,
                label: 'Pending Transcription',
              },
              processing: {
                color: 'text-blue-600',
                bg: 'bg-blue-50 border-blue-200',
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                label: 'Transcribing Audio...',
              },
              completed: {
                color: 'text-green-600',
                bg: 'bg-green-50 border-green-200',
                icon: <CheckCircle className="h-4 w-4" />,
                label: 'Video Ready',
              },
              failed: {
                color: 'text-red-600',
                bg: 'bg-red-50 border-red-200',
                icon: <AlertCircle className="h-4 w-4" />,
                label: 'Transcription Failed',
              },
            };
            const config = statusConfig[video.processing_status] || statusConfig.pending;

            return (
            <li key={video.id} className={`shadow overflow-hidden rounded-md px-6 py-4 border ${config.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${config.color}`}>
                    {config.icon}
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  {/* Show error details if transcription failed */}
                  {video.processing_status === 'failed' && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                      <p className="font-medium">Error Details:</p>
                      <p className="mt-0.5">{video.processing_error || 'Unknown error - check ElevenLabs API key'}</p>
                      <p className="mt-1 text-red-600">Note: Video playback still works. Only audio transcription failed.</p>
                      {onRetryTranscription && (
                        <button
                          onClick={() => handleRetryTranscription(video.id)}
                          disabled={retryingVideoId === video.id}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:bg-red-400"
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
                    <p className="mt-1 text-xs text-green-600">Audio transcribed and added to knowledge base</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handlePreviewVideo(video)}
                    className="px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="Preview video"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
            <li className="bg-white shadow overflow-hidden rounded-md px-6 py-4">
              <p className="text-center text-sm text-gray-500">No videos have been uploaded yet.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
