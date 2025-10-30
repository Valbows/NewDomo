/**
 * Video Processing Service Implementation
 * 
 * Handles video transcription, processing, and media operations.
 */

import { createClient } from '@/lib/utils/supabase';
import { ServiceResult, ServiceErrorCode } from '../types';
import { logError } from '@/lib/errors';
import OpenAI from 'openai';

export interface VideoProcessingResult {
  videoId: string;
  transcript: string;
  chunksCreated: number;
}

export interface VideoUrlResult {
  videoUrl: string;
  storageUrl: string;
}

export interface VideoUploadResult {
  bucket: string;
  key: string;
  sourceUrl: string;
}

export interface IVideoService {
  /**
   * Process video transcription and create knowledge chunks
   */
  processVideoTranscription(videoId: string): Promise<ServiceResult<VideoProcessingResult>>;

  /**
   * Generate signed URL for video access
   */
  generateVideoUrl(demoId: string, videoTitle: string): Promise<ServiceResult<VideoUrlResult>>;

  /**
   * Upload test video to storage
   */
  uploadTestVideo(targetKey: string, sourceUrl: string): Promise<ServiceResult<VideoUploadResult>>;
}

export class VideoService implements IVideoService {
  readonly name = 'VideoService';

  /**
   * Process video transcription and create knowledge chunks
   */
  async processVideoTranscription(videoId: string): Promise<ServiceResult<VideoProcessingResult>> {
    const supabase = createClient();

    try {
      // 1. Update video status to 'processing'
      await supabase
        .from('demo_videos')
        .update({ processing_status: 'processing', processing_error: null })
        .eq('id', videoId);

      // 2. Fetch video details
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        throw new Error('Failed to retrieve video from database.');
      }

      // 3. Download video from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('demo-videos')
        .download(video.storage_url);

      if (downloadError || !fileData) {
        throw new Error('Failed to download video from storage.');
      }

      // 4. Transcribe the audio using OpenAI Whisper
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: new File([fileData], 'video.mp4', { type: 'video/mp4' }),
        model: 'whisper-1',
      });

      const transcript = transcription.text;

      // 5. Persist transcript on the video record
      await supabase
        .from('demo_videos')
        .update({ transcript })
        .eq('id', videoId);

      // 6. Get demo ID for knowledge chunks
      const { data: videoData } = await supabase
        .from('demo_videos')
        .select('demo_id')
        .eq('id', videoId)
        .single();

      const demoId = videoData?.demo_id;

      // 7. Create knowledge chunks
      const chunks = this.chunkTranscript(transcript);
      const chunksCreated = await this.createKnowledgeChunks(demoId, videoId, chunks);

      // 8. Update video status to 'completed'
      await supabase
        .from('demo_videos')
        .update({ processing_status: 'completed' })
        .eq('id', videoId);

      return {
        success: true,
        data: {
          videoId,
          transcript,
          chunksCreated
        }
      };

    } catch (error) {
      logError(error, 'Video transcription error');
      
      // Update video status to 'failed'
      await supabase
        .from('demo_videos')
        .update({ 
          processing_status: 'failed', 
          processing_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', videoId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video processing failed',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Generate signed URL for video access
   */
  async generateVideoUrl(demoId: string, videoTitle: string = 'Fourth Video'): Promise<ServiceResult<VideoUrlResult>> {
    const supabase = createClient();

    try {
      // Find the video
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demoId)
        .eq('title', videoTitle)
        .single();

      if (videoError || !video) {
        return {
          success: false,
          error: 'Video not found',
          code: ServiceErrorCode.NOT_FOUND
        };
      }

      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600);

      if (signedUrlError || !signedUrlData) {
        return {
          success: false,
          error: 'Could not generate video URL',
          code: ServiceErrorCode.INTERNAL_ERROR
        };
      }

      return {
        success: true,
        data: {
          videoUrl: signedUrlData.signedUrl,
          storageUrl: video.storage_url
        }
      };

    } catch (error) {
      logError(error, 'Video URL generation error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video URL',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Upload test video to storage
   */
  async uploadTestVideo(
    targetKey: string = 'test-videos/fourth-video.mp4',
    sourceUrl: string = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
  ): Promise<ServiceResult<VideoUploadResult>> {
    const supabase = createClient();

    try {
      // Fetch sample video
      const resp = await fetch(sourceUrl);
      if (!resp.ok) {
        return {
          success: false,
          error: `Failed to download sample from ${sourceUrl}`,
          code: ServiceErrorCode.EXTERNAL_API_ERROR
        };
      }

      const arrayBuf = await resp.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuf);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('demo-videos')
        .upload(targetKey, fileBytes, { contentType: 'video/mp4', upsert: true });

      if (error) {
        logError(error, 'Video upload error');
        return {
          success: false,
          error: 'Upload failed',
          code: ServiceErrorCode.INTERNAL_ERROR
        };
      }

      return {
        success: true,
        data: {
          bucket: 'demo-videos',
          key: targetKey,
          sourceUrl
        }
      };

    } catch (error) {
      logError(error, 'Test video upload error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload test video',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Chunk transcript into smaller pieces for embeddings
   */
  private chunkTranscript(transcript: string): string[] {
    const maxChunkSize = 1000; // Adjust based on embedding model limits
    const chunks: string[] = [];
    
    if (transcript.length <= maxChunkSize) {
      return [transcript];
    }

    // Simple chunking by sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Create knowledge chunks in database
   */
  private async createKnowledgeChunks(demoId: string, videoId: string, chunks: string[]): Promise<number> {
    const supabase = createClient();

    const rows = chunks.map((chunk) => ({
      demo_id: demoId,
      content: chunk,
      chunk_type: 'transcript' as const,
      source: `video:${videoId}`,
    }));

    const { error } = await supabase
      .from('knowledge_chunks')
      .insert(rows);

    if (error) {
      logError(error, 'Knowledge chunks creation error');
      throw new Error('Failed to create knowledge chunks');
    }

    return chunks.length;
  }
}

// Export singleton instance
export const videoService = new VideoService();