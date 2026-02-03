import { supabase } from '@/lib/supabase';
import { logError, getErrorMessage } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import type { DemoVideo, ProcessingStatus } from '../types';
import type { ModuleId } from '@/lib/modules/types';

interface VideoUploadParams {
  selectedVideoFile: File;
  videoTitle: string;
  demoId: string;
  demoVideos: DemoVideo[];
  /** Module this video belongs to */
  moduleId?: ModuleId | null;
  setProcessingStatus: (status: ProcessingStatus) => void;
  setError: (error: string | null) => void;
  setDemoVideos: (videos: DemoVideo[]) => void;
  setSelectedVideoFile: (file: File | null) => void;
  setVideoTitle: (title: string) => void;
}

export async function handleVideoUpload(params: VideoUploadParams) {
  const {
    selectedVideoFile,
    videoTitle,
    demoId,
    demoVideos,
    moduleId,
    setProcessingStatus,
    setError,
    setDemoVideos,
    setSelectedVideoFile,
    setVideoTitle,
  } = params;

  if (!selectedVideoFile || !videoTitle) {
    setError('Please select a video file and provide a title.');
    return;
  }

  setProcessingStatus({ stage: 'uploading', progress: 0, message: 'Uploading video...' });
  setError(null);

  try {
    // Get current user to ensure authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    const fileExtension = selectedVideoFile.name.split('.').pop();
    const filePath = `${demoId}/${uuidv4()}.${fileExtension}`;

    // Upload with explicit options to avoid metadata issues
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('demo-videos')
      .upload(filePath, selectedVideoFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    setProcessingStatus({ stage: 'processing', progress: 50, message: 'Video uploaded. Adding to database...' });

    const { data: newVideo, error: dbError } = await supabase
      .from('demo_videos')
      .insert({
        demo_id: demoId,
        storage_url: filePath,
        title: videoTitle,
        order_index: demoVideos.length + 1,
        processing_status: 'pending',
        module_id: moduleId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    if (!newVideo) throw new Error('Failed to create video record in database.');

    // Start transcription in background, passing module_id
    fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        demo_video_id: newVideo.id,
        module_id: moduleId || null,
      }),
    }).catch((err: unknown) => logError(err, 'Transcription request failed'));

    // Start Twelve Labs video indexing in background (for AI video understanding)
    // This is optional - failure doesn't affect core functionality
    fetch('/api/twelve-labs/index-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demoVideoId: newVideo.id }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success && data.skipped && process.env.NODE_ENV !== 'production') {
          console.warn('[TwelveLabs] Video indexing skipped:', data.message);
        }
      })
      .catch((err: unknown) => {
        // Only log in development - this is an optional feature
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[TwelveLabs] Video indexing request failed (optional):', getErrorMessage(err));
        }
      });

    setDemoVideos([...demoVideos, newVideo]);
    setProcessingStatus({ stage: 'completed', progress: 100, message: 'Video uploaded. Transcription in progress.' });
    setSelectedVideoFile(null);
    setVideoTitle('');

  } catch (err: unknown) {
    logError(err, 'Video upload error');
    setError(getErrorMessage(err, 'Failed to upload video.'));
    setProcessingStatus({ stage: 'error', progress: 0, message: 'Upload failed.' });
  }
}

export async function handlePreviewVideo(
  video: DemoVideo,
  setPreviewVideoUrl: (url: string | null) => void,
  setError: (error: string | null) => void
) {
  try {
    const { data, error } = await supabase.storage
      .from('demo-videos')
      .createSignedUrl(video.storage_url, 3600);
    if (error) throw error;
    setPreviewVideoUrl(data.signedUrl);
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Could not generate preview link.'));
  }
}

export async function handleDeleteVideo(
  id: string,
  demoVideos: DemoVideo[],
  setDemoVideos: (videos: DemoVideo[]) => void,
  setError: (error: string | null) => void
) {
  try {
    const videoToDelete = demoVideos.find(v => v.id === id);
    if (!videoToDelete) return;

    const { error: storageError } = await supabase.storage.from('demo-videos').remove([videoToDelete.storage_url]);
    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('demo_videos').delete().eq('id', id);
    if (dbError) throw dbError;

    setDemoVideos(demoVideos.filter(v => v.id !== id));
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to delete video.'));
  }
}

/**
 * Update a video's module assignment
 */
export async function handleUpdateVideoModule(
  videoId: string,
  moduleId: ModuleId | null,
  demoVideos: DemoVideo[],
  setDemoVideos: (videos: DemoVideo[]) => void,
  setError: (error: string | null) => void
) {
  try {
    const { error } = await supabase
      .from('demo_videos')
      .update({ module_id: moduleId })
      .eq('id', videoId);

    if (error) throw error;

    setDemoVideos(
      demoVideos.map((v) =>
        v.id === videoId ? { ...v, module_id: moduleId } : v
      )
    );
  } catch (err: unknown) {
    setError(getErrorMessage(err, 'Failed to update video module.'));
  }
}
