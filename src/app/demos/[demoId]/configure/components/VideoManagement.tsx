import { Play, Upload, Trash2 } from 'lucide-react';
import { DemoVideo, ProcessingStatus } from '@/app/demos/[demoId]/configure/types';
import { SupabaseClient } from '@supabase/supabase-js';

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
  setPreviewVideoUrl
}: VideoManagementProps) => {
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
            const statusColors: Record<string, string> = {
              pending: 'text-amber-600 bg-amber-50',
              processing: 'text-blue-600 bg-blue-50',
              completed: 'text-green-600 bg-green-50',
              failed: 'text-red-600 bg-red-50',
            };
            const statusLabels: Record<string, string> = {
              pending: 'Pending',
              processing: 'Processing...',
              completed: 'Ready',
              failed: 'Processing Failed',
            };
            const statusClass = statusColors[video.processing_status] || 'text-gray-600 bg-gray-50';
            const statusLabel = statusLabels[video.processing_status] || video.processing_status;

            return (
            <li key={video.id} className="bg-white shadow overflow-hidden rounded-md px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 truncate">{video.title}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePreviewVideo(video)}
                  className="px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Play className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDeleteVideo(video.id)}
                  className="px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
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
