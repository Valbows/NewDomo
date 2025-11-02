/**
 * Video Management Hook
 *
 * Handles video upload, preview, and deletion logic.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/auth';
import { DemoVideo, ProcessingStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getErrorMessage, logError } from '@/lib/errors';

export function useVideoManagement(
  demoId: string,
  demoVideos: DemoVideo[],
  setDemoVideos: (videos: DemoVideo[]) => void,
  setError: (error: string | null) => void
) {
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ 
    stage: 'idle', 
    progress: 0, 
    message: '' 
  });
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle.trim()) {
      setError('Please select a video file and provide a title.');
      return;
    }

    setError(null);
    setProcessingStatus({ stage: 'uploading', progress: 25, message: 'Uploading video...' });

    try {
      // Authenticate user
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.session) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const fileExtension = selectedVideoFile.name.split('.').pop();
      const filePath = `${demoId}/${uuidv4()}.${fileExtension}`;

      console.log('Uploading file:', filePath, 'Size:', selectedVideoFile.size);

      // Upload to storage
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
      setProcessingStatus({ 
        stage: 'processing', 
        progress: 50, 
        message: 'Video uploaded. Adding to database...' 
      });

      // Add to database
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

      setDemoVideos([...demoVideos, newVideo]);
      setProcessingStatus({ 
        stage: 'completed', 
        progress: 100, 
        message: 'Video uploaded. Transcription in progress.' 
      });
      setSelectedVideoFile(null);
      setVideoTitle('');

    } catch (err: unknown) {
      logError(err, 'Video upload error');
      setError(getErrorMessage(err, 'Failed to upload video.'));
      setProcessingStatus({ stage: 'error', progress: 0, message: 'Upload failed.' });
    }
  };

  const handlePreviewVideo = async (video: DemoVideo) => {
    try {
      const { data, error } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600);
      if (error) throw error;
      setPreviewVideoUrl(data.signedUrl);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not generate preview link.'));
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const videoToDelete = demoVideos.find(v => v.id === id);
      if (!videoToDelete) return;

      const { error: storageError } = await supabase.storage
        .from('demo-videos')
        .remove([videoToDelete.storage_url]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('demo_videos')
        .delete()
        .eq('id', id);
      if (dbError) throw dbError;

      setDemoVideos(demoVideos.filter(v => v.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete video.'));
    }
  };

  return {
    selectedVideoFile,
    setSelectedVideoFile,
    videoTitle,
    setVideoTitle,
    processingStatus,
    previewVideoUrl,
    setPreviewVideoUrl,
    handleVideoUpload,
    handlePreviewVideo,
    handleDeleteVideo,
  };
}