/**
 * Video Processing Service
 * Handles video-specific operations like URL generation and broadcasting
 */

import {TavusClient} from './tavus-client';
import {VideoResponse, ServiceResult} from './types';

export class VideoProcessingService {
  private client: TavusClient;

  constructor(client: TavusClient) {
    this.client = client;
  }

  /**
   * Find demo by conversation ID
   */
  async findDemoByConversation(
    supabase: any,
    conversationId: string
  ): Promise<ServiceResult<string>> {
    try {
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (demoError || !demo) {
        // console.error(`Could not find demo for conversation_id: ${conversationId}`, demoError);
        return {
          success: false,
          error: 'Demo not found for conversation',
        };
      }

      return {
        success: true,
        data: demo.id,
      };
    } catch (error) {
      // console.error('Error finding demo by conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find video in demo by title
   */
  async findVideoInDemo(
    supabase: any,
    demoId: string,
    videoTitle: string
  ): Promise<ServiceResult<string>> {
    try {
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demoId)
        .eq('title', videoTitle)
        .single();

      if (videoError || !video) {
        // Log available videos for debugging
        const { data: availableVideos } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demoId);
        
        // console.error(`Could not find video with title '${videoTitle}' in demo ${demoId}`);
        // console.log('Available videos in demo:', availableVideos?.map((v: any) => v.title));
        
        return {
          success: false,
          error: 'Video not found',
        };
      }

      return {
        success: true,
        data: video.storage_url,
      };
    } catch (error) {
      // console.error('Error finding video in demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate signed URL for video
   */
  async generateSignedVideoUrl(
    supabase: any,
    storageUrl: string
  ): Promise<ServiceResult<VideoResponse>> {
    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(storageUrl, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        // console.error('Error creating signed URL:', signedUrlError);
        return {
          success: false,
          error: 'Could not generate video URL',
        };
      }

      return {
        success: true,
        data: {
          signed_url: signedUrlData.signedUrl,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      };
    } catch (error) {
      // console.error('Error generating signed video URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Broadcast video URL to frontend via realtime
   */
  async broadcastVideoUrl(
    supabase: any,
    demoId: string,
    videoUrl: string
  ): Promise<ServiceResult<void>> {
    try {
      const channelName = `demo-${demoId}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to channel
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED' && !settled) {
            settled = true;

            resolve();
          }
        });
        setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error('Server Realtime subscribe timeout'));
          }
        }, 2000);
      });

      // Broadcast video URL
      await channel.send({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: videoUrl },
      });

      // Clean up channel
      await supabase.removeChannel(channel);

      return {
        success: true,
      };
    } catch (error) {
      // console.warn('Video URL broadcast failed (non-fatal):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Track video showcase for analytics
   */
  async trackVideoShowcase(
    supabase: any,
    conversationId: string,
    demoId: string,
    videoTitle: string
  ): Promise<ServiceResult<void>> {
    try {
      // Read existing record (if any)
      const { data: existingShowcase } = await supabase
        .from('video_showcase_data')
        .select('id, requested_videos, videos_shown, objective_name')
        .eq('conversation_id', conversationId)
        .single();

      const prevShown = Array.isArray(existingShowcase?.videos_shown)
        ? existingShowcase!.videos_shown as string[]
        : [];
      const updatedVideosShown = Array.from(new Set([...prevShown, videoTitle]));

      const payload = {
        conversation_id: conversationId,
        demo_id: demoId,
        objective_name: existingShowcase?.objective_name || 'video_showcase',
        requested_videos: (existingShowcase?.requested_videos as any) || null,
        videos_shown: updatedVideosShown,
        received_at: new Date().toISOString(),
      } as any;

      if (existingShowcase?.id) {
        // Update existing record
        const { error: updateErr } = await supabase
          .from('video_showcase_data')
          .update({
            videos_shown: updatedVideosShown,
            received_at: new Date().toISOString(),
          })
          .eq('id', existingShowcase.id);

        if (updateErr) {
          return {
            success: false,
            error: 'Failed to update video showcase data',
          };
        }
      } else {
        // Insert new record
        const { error: insertErr } = await supabase
          .from('video_showcase_data')
          .insert(payload);

        if (insertErr) {
          return {
            success: false,
            error: 'Failed to insert video showcase data',
          };
        }
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error tracking video showcase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available videos for demo
   */
  async getAvailableVideos(
    supabase: any,
    demoId: string
  ): Promise<ServiceResult<Array<{ title: string; storage_url: string }>>> {
    try {
      const { data: videos, error: videosError } = await supabase
        .from('demo_videos')
        .select('title, storage_url')
        .eq('demo_id', demoId);

      if (videosError) {
        return {
          success: false,
          error: 'Failed to fetch available videos',
        };
      }

      return {
        success: true,
        data: videos || [],
      };
    } catch (error) {
      // console.error('Error getting available videos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new video processing service instance
 */
export function createVideoProcessingService(client: TavusClient): VideoProcessingService {
  return new VideoProcessingService(client);
}