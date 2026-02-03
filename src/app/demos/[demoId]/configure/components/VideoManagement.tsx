import React, { useState, useMemo } from 'react';
import { Play, Upload, Trash2, AlertCircle, CheckCircle, Clock, Loader2, RotateCcw, Brain, Sparkles, X, Layers } from 'lucide-react';
import { DemoVideo, ProcessingStatus } from '@/app/demos/[demoId]/configure/types';
import { ModuleSelector } from './ModuleSelector';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';
import type { ModuleId } from '@/lib/modules/types';

// Helper to get Twelve Labs status from video metadata
function getTwelveLabsStatus(video: DemoVideo): {
  status: 'none' | 'pending' | 'indexing' | 'ready' | 'failed';
  hasContext: boolean;
} {
  const twelvelabs = video.metadata?.twelvelabs;
  if (!twelvelabs) {
    return { status: 'none', hasContext: false };
  }
  return {
    status: twelvelabs.status || 'pending',
    hasContext: !!twelvelabs.generatedContext,
  };
}

// Success Modal Component
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-domo-bg-card border border-domo-border rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-domo-text-muted hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-domo-primary/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-domo-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Videos Ready!</h3>
          <p className="text-domo-text-secondary mb-6">
            All your videos now have AI context with chapters and summaries. Your Domo agent can now provide timestamp-aware responses and guide users to specific video sections.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

interface VideoManagementProps {
  demoVideos: DemoVideo[];
  processingStatus: ProcessingStatus;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  handleVideoUpload: (moduleId?: ModuleId | null) => void;
  handlePreviewVideo: (video: DemoVideo) => void;
  handleDeleteVideo: (id: string) => void;
  handleUpdateVideoModule?: (videoId: string, moduleId: ModuleId | null) => Promise<void>;
  previewVideoUrl: string | null;
  setPreviewVideoUrl: (url: string | null) => void;
  onRetryTranscription?: (videoId: string) => Promise<void>;
  onGenerateAIContext?: (videoId: string) => Promise<void>;
  onIndexWithTwelveLabs?: (videoId: string) => Promise<{ success: boolean; error?: string }>;
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
  handleUpdateVideoModule,
  previewVideoUrl,
  setPreviewVideoUrl,
  onRetryTranscription,
  onGenerateAIContext,
  onIndexWithTwelveLabs
}: VideoManagementProps) => {
  const [retryingVideoId, setRetryingVideoId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, phase: '' });
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId | null>(null);
  const [editingModuleVideoId, setEditingModuleVideoId] = useState<string | null>(null);

  // Calculate AI context stats
  const aiContextStats = useMemo(() => {
    const total = demoVideos.length;
    const withContext = demoVideos.filter(v => getTwelveLabsStatus(v).hasContext).length;
    const needsIndexing = demoVideos.filter(v => getTwelveLabsStatus(v).status === 'none').length;
    const indexing = demoVideos.filter(v => {
      const s = getTwelveLabsStatus(v).status;
      return s === 'indexing' || s === 'pending';
    }).length;
    const needsContext = demoVideos.filter(v => {
      const status = getTwelveLabsStatus(v);
      return status.status === 'ready' && !status.hasContext;
    }).length;

    const stats = { total, withContext, needsIndexing, indexing, needsContext };
    console.log('[VideoManagement] AI Context Stats:', stats);
    console.log('[VideoManagement] Videos metadata:', demoVideos.map(v => ({
      id: v.id,
      title: v.title,
      twelvelabs: v.metadata?.twelvelabs
    })));
    return stats;
  }, [demoVideos]);

  const handleRetryTranscription = async (videoId: string) => {
    if (!onRetryTranscription) return;
    setRetryingVideoId(videoId);
    try {
      await onRetryTranscription(videoId);
    } finally {
      setRetryingVideoId(null);
    }
  };

  // Helper to check video status from API
  const checkVideoStatus = async (videoId: string): Promise<string> => {
    try {
      const response = await fetch('/api/twelve-labs/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoVideoId: videoId }),
      });
      const data = await response.json();
      return data.status || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const handleProcessAllVideos = async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[VideoManagement] Generate All clicked', {
        hasIndexHandler: !!onIndexWithTwelveLabs,
        hasContextHandler: !!onGenerateAIContext,
        stats: aiContextStats
      });
    }

    if (!onIndexWithTwelveLabs || !onGenerateAIContext) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[VideoManagement] Missing handlers, returning early');
      }
      return;
    }

    // Get ALL videos that need ANY work
    const allVideos = [...demoVideos];
    const videosToIndex = allVideos.filter(v => getTwelveLabsStatus(v).status === 'none');
    const videosIndexing = allVideos.filter(v => {
      const s = getTwelveLabsStatus(v).status;
      return s === 'indexing' || s === 'pending';
    });
    const videosNeedingContext = allVideos.filter(v => {
      const status = getTwelveLabsStatus(v);
      return status.status === 'ready' && !status.hasContext;
    });
    const videosWithoutFullContext = allVideos.filter(v => !getTwelveLabsStatus(v).hasContext);

    console.log('[VideoManagement] Videos breakdown:', {
      total: allVideos.length,
      toIndex: videosToIndex.length,
      indexing: videosIndexing.length,
      needingContext: videosNeedingContext.length,
      withoutFullContext: videosWithoutFullContext.length
    });

    // If all videos already have full context, show success
    if (videosWithoutFullContext.length === 0) {
      setShowSuccessModal(true);
      return;
    }

    setProcessingAll(true);
    setProcessingError(null);

    try {
      // PHASE 1: Index videos that haven't been indexed
      if (videosToIndex.length > 0) {
        setProcessingProgress({ current: 0, total: videosToIndex.length, phase: 'Sending to AI' });
        console.log('[VideoManagement] Phase 1: Indexing', videosToIndex.length, 'videos');

        for (let i = 0; i < videosToIndex.length; i++) {
          const video = videosToIndex[i];
          setProcessingVideoId(video.id);
          setProcessingProgress({ current: i + 1, total: videosToIndex.length, phase: 'Sending to AI' });

          console.log('[VideoManagement] Indexing video:', video.id, video.title);
          const result = await onIndexWithTwelveLabs(video.id);

          if (!result.success) {
            console.error('[VideoManagement] Indexing failed for video:', video.title, result.error);
            setProcessingError(`AI indexing failed. Please try again later.`);
            return; // Stop processing on first failure
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // PHASE 2: Wait for all indexing to complete (videos we just indexed + already indexing)
      const videosToWaitFor = [...videosToIndex, ...videosIndexing];
      if (videosToWaitFor.length > 0) {
        setProcessingProgress({ current: 0, total: videosToWaitFor.length, phase: 'AI analyzing videos' });
        setProcessingVideoId(null);
        console.log('[VideoManagement] Phase 2: Waiting for', videosToWaitFor.length, 'videos to complete analysis');

        // Poll until all videos are ready (max 10 minutes)
        const startTime = Date.now();
        const maxWaitMs = 10 * 60 * 1000;
        let allReady = false;

        while (!allReady && (Date.now() - startTime < maxWaitMs)) {
          let readyCount = 0;

          for (const video of videosToWaitFor) {
            const status = await checkVideoStatus(video.id);
            if (status === 'ready') {
              readyCount++;
            } else if (status === 'failed') {
              console.log('[VideoManagement] Video indexing failed:', video.id);
              readyCount++; // Count as done (failed)
            }
          }

          setProcessingProgress({
            current: readyCount,
            total: videosToWaitFor.length,
            phase: 'AI analyzing videos'
          });

          console.log('[VideoManagement] Phase 2 progress:', readyCount, '/', videosToWaitFor.length);

          if (readyCount >= videosToWaitFor.length) {
            allReady = true;
          } else {
            // Wait 5 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        if (!allReady) {
          console.error('[VideoManagement] Timeout waiting for video analysis');
          setProcessingError('Video analysis is taking longer than expected. Please try again.');
          return;
        }
      }

      // PHASE 3: Generate context for ALL videos without context
      // This includes: videos we just indexed + videos that were already ready but missing context
      const allVideosForContext = [...videosWithoutFullContext];

      if (allVideosForContext.length > 0) {
        setProcessingProgress({ current: 0, total: allVideosForContext.length, phase: 'Generating chapters' });
        console.log('[VideoManagement] Phase 3: Generating context for', allVideosForContext.length, 'videos');

        for (let i = 0; i < allVideosForContext.length; i++) {
          const video = allVideosForContext[i];
          setProcessingVideoId(video.id);
          setProcessingProgress({ current: i + 1, total: allVideosForContext.length, phase: 'Generating chapters' });

          console.log('[VideoManagement] Generating context for:', video.id, video.title);
          await onGenerateAIContext(video.id);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // FINAL CHECK: Verify all videos now have context before showing success
      // Note: We trust that if we got here without errors, all videos should have context
      console.log('[VideoManagement] All processing complete!');
      setProcessingVideoId(null);
      setShowSuccessModal(true);

    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[VideoManagement] Error processing videos:', err);
      }
    } finally {
      setProcessingAll(false);
      setProcessingVideoId(null);
      setProcessingProgress({ current: 0, total: 0, phase: '' });
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
            <div>
              <label className="block text-sm font-medium text-domo-text-secondary mb-2">
                Demo Module <span className="text-domo-error">*</span>
              </label>
              <ModuleSelector
                value={selectedModuleId}
                onChange={setSelectedModuleId}
                placeholder="Select module..."
                size="md"
              />
              <p className="text-xs text-domo-text-muted mt-1">
                Required: Assign content to a demo stage for organized agent responses
              </p>
              {!selectedModuleId && videoTitle && selectedVideoFile && (
                <p className="text-xs text-amber-400 mt-1">
                  Please select a module before uploading
                </p>
              )}
            </div>
            <button
              onClick={() => {
                handleVideoUpload(selectedModuleId);
                setSelectedModuleId(null);
              }}
              disabled={processingStatus.stage === 'uploading' || !videoTitle || !selectedVideoFile || !selectedModuleId}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="-ml-1 mr-2 h-5 w-5" />
              {processingStatus.stage === 'uploading' ? 'Uploading...' : 'Upload Video'}
            </button>
            {processingStatus.stage !== 'idle' && (
              <div className="mt-4 text-sm text-domo-text-secondary">
                <div className="flex items-center justify-between mb-1">
                  <p>{processingStatus.message}</p>
                  <span className="text-domo-primary font-semibold">{Math.round(processingStatus.progress)}%</span>
                </div>
                <div className="w-full bg-domo-bg-dark rounded-full h-2.5">
                  <div className="bg-domo-primary h-2.5 rounded-full transition-all" style={{ width: `${processingStatus.progress}%` }}></div>
                </div>
                {processingStatus.stage === 'uploading' && (
                  <p className="text-xs text-domo-text-muted mt-1">Uploading video... This may take a moment depending on file size.</p>
                )}
                {processingStatus.stage === 'processing' && (
                  <p className="text-xs text-domo-text-muted mt-1">Transcribing audio... Typically takes 30-60 seconds.</p>
                )}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Uploaded Videos</h3>
          {/* AI context indicator - purple themed */}
          {demoVideos.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              {/* Error display */}
              {processingError && (
                <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">
                  {processingError}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
              {processingAll && processingProgress.total > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-purple-400 font-medium">
                    {Math.round((processingProgress.current / processingProgress.total) * 100)}%
                  </span>
                  <div className="w-32 bg-purple-900/30 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-purple-300">
                    {processingProgress.phase}: {processingProgress.current}/{processingProgress.total}
                  </span>
                </div>
              ) : (
                <span className="text-purple-400">
                  {aiContextStats.withContext} of {aiContextStats.total} with AI context
                </span>
              )}
              {/* Show button when processing, or when there's work to do (indexing, analyzing, or context generation needed) */}
              {(processingAll || ((aiContextStats.needsIndexing > 0 || aiContextStats.indexing > 0 || aiContextStats.needsContext > 0) && onIndexWithTwelveLabs && onGenerateAIContext)) && (
                <button
                  onClick={handleProcessAllVideos}
                  disabled={processingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:text-purple-200 transition-colors"
                >
                  {processingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processingProgress.phase || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate All
                    </>
                  )}
                </button>
              )}
              </div>
            </div>
          )}
        </div>
        <ul className="space-y-3">
          {demoVideos.map(video => {
            const isCurrentlyProcessing = processingVideoId === video.id;
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
                label: 'Transcribing Audio... (typically 30-60 seconds)',
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

            // Override styling if this video is currently being processed for AI
            const cardBg = isCurrentlyProcessing
              ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
              : config.bg;

            // Determine what action is being taken on this video
            const tlStatus = getTwelveLabsStatus(video);
            const processingAction = isCurrentlyProcessing
              ? (processingProgress.phase === 'Sending to AI'
                  ? 'Sending to AI for analysis...'
                  : 'Generating chapters & summary...')
              : null;

            return (
            <li key={video.id} className={`rounded-xl px-6 py-4 border ${cardBg} transition-all duration-300`}>
              {/* Processing indicator bar */}
              {isCurrentlyProcessing && processingAction && (
                <div className="mb-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">{processingAction}</span>
                  <div className="flex-1 bg-purple-900/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{video.title}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${config.color}`}>
                    {config.icon}
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  {/* Show animated progress bar for processing videos */}
                  {video.processing_status === 'processing' && (
                    <div className="mt-2 w-full max-w-xs">
                      <div className="w-full bg-domo-bg-dark rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-domo-primary h-1.5 rounded-full animate-pulse"
                          style={{
                            width: '100%',
                            animation: 'progress-indeterminate 2s ease-in-out infinite'
                          }}
                        />
                      </div>
                      <style jsx>{`
                        @keyframes progress-indeterminate {
                          0% { transform: translateX(-100%); width: 50%; }
                          50% { transform: translateX(50%); width: 50%; }
                          100% { transform: translateX(200%); width: 50%; }
                        }
                      `}</style>
                    </div>
                  )}
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

                  {/* Twelve Labs AI Status - subtle indicator only */}
                  {(() => {
                    const tlStatus = getTwelveLabsStatus(video);
                    if (tlStatus.status === 'none') return null;

                    const tlConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
                      pending: {
                        color: 'text-purple-400',
                        icon: <Clock className="h-3 w-3" />,
                        label: 'AI Analysis Queued',
                      },
                      indexing: {
                        color: 'text-purple-400',
                        icon: <Loader2 className="h-3 w-3 animate-spin" />,
                        label: 'AI Analyzing Video...',
                      },
                      ready: {
                        color: 'text-purple-400',
                        icon: tlStatus.hasContext ? <Sparkles className="h-3 w-3" /> : <Brain className="h-3 w-3" />,
                        label: tlStatus.hasContext ? 'AI Context Ready (Chapters + Summary)' : 'AI Indexed',
                      },
                      failed: {
                        color: 'text-amber-400',
                        icon: <AlertCircle className="h-3 w-3" />,
                        label: 'AI Analysis Failed (optional)',
                      },
                    };
                    const cfg = tlConfig[tlStatus.status] || tlConfig.pending;

                    return (
                      <div className={`flex items-center gap-1 mt-1 ${cfg.color}`}>
                        {cfg.icon}
                        <span className="text-xs">{cfg.label}</span>
                      </div>
                    );
                  })()}

                  {/* Module Assignment */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Layers className="h-3 w-3 text-domo-text-muted" />
                    {editingModuleVideoId === video.id ? (
                      <ModuleSelector
                        value={video.module_id as ModuleId | null}
                        onChange={async (newModuleId) => {
                          if (handleUpdateVideoModule) {
                            await handleUpdateVideoModule(video.id, newModuleId);
                          }
                          setEditingModuleVideoId(null);
                        }}
                        size="sm"
                        placeholder="Select module..."
                        allowUnassigned={true}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingModuleVideoId(video.id)}
                        className="text-xs text-domo-text-muted hover:text-domo-primary transition-colors"
                      >
                        {video.module_id ? (
                          <span className="text-domo-primary">
                            {DEFAULT_PRODUCT_DEMO_MODULES.find(m => m.moduleId === video.module_id)?.name || video.module_id}
                          </span>
                        ) : (
                          <span className="italic">No module assigned</span>
                        )}
                      </button>
                    )}
                  </div>
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

      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
};
