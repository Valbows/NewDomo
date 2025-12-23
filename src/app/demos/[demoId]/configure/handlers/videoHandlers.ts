import { supabase } from '@/lib/supabase';
import { logError, getErrorMessage } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import type { DemoVideo, ProcessingStatus } from '../types';

interface VideoUploadParams {
  selectedVideoFile: File;
  videoTitle: string;
  demoId: string;
  demoVideos: DemoVideo[];
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

    console.log('Uploading file:', filePath, 'Size:', selectedVideoFile.size);

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

    console.log('Upload successful:', uploadData);
    setProcessingStatus({ stage: 'processing', progress: 50, message: 'Video uploaded. Adding to database...' });

    const { data: newVideo, error: dbError } = await supabase
      .from('demo_videos')
      .insert({
        demo_id: demoId,
        storage_url: filePath,
        title: videoTitle,
        order_index: demoVideos.length + 1,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    if (!newVideo) throw new Error('Failed to create video record in database.');

    // Start transcription in background
    fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo_video_id: newVideo.id }),
    }).catch((err: unknown) => logError(err, 'Transcription request failed'));

    // Start Twelve Labs video indexing in background (for AI video understanding)
    fetch('/api/twelve-labs/index-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demoVideoId: newVideo.id }),
    }).catch((err: unknown) => logError(err, 'Twelve Labs indexing request failed'));

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
