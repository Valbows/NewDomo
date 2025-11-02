/**
 * Demo Lifecycle Service
 * 
 * Handles demo creation, test data setup, and lifecycle management operations.
 */

import {createServerSupabaseClient} from '@/lib/utils/supabase';
import {ServiceResult, ServiceErrorCode} from '../types';
import {KnowledgeChunk, DemoVideo, TestDemoParams} from './types';
import {logError} from '@/lib/errors';

export class DemoLifecycleService {
  readonly name = 'DemoLifecycleService';

  /**
   * Create a test demo with sample data
   */
  async createTestDemo(params?: TestDemoParams): Promise<ServiceResult<{ demoId: string; videosCreated: number }>> {
    try {
      // Use service role client to bypass RLS for testing
      const supabase = createServerSupabaseClient();

      const testDemoId = params?.demoId || '12345678-1234-1234-1234-123456789012';
      const testUserId = params?.userId || '12345678-1234-1234-1234-123456789012';
      const demoName = params?.name || 'Test Demo';

      // Check if demo already exists
      const { data: existingDemo } = await supabase
        .from('demos')
        .select('id')
        .eq('id', testDemoId)
        .single();

      if (existingDemo) {
        // Check if videos already exist for this demo
        const { data: existingVideos, error: existingVideosError } = await supabase
          .from('demo_videos')
          .select('id')
          .eq('demo_id', testDemoId);

        if (existingVideosError) {
          logError(existingVideosError, 'Existing videos check error');
          return {
            success: false,
            error: 'Failed to check existing videos',
            code: ServiceErrorCode.DATABASE_ERROR
          };
        }

        if (!existingVideos || existingVideos.length === 0) {
          const defaultVideos = this.getDefaultTestVideos(testDemoId);
          const { error: insertMissingVideosError } = await supabase
            .from('demo_videos')
            .insert(defaultVideos);

          if (insertMissingVideosError) {
            logError(insertMissingVideosError, 'Insert default videos for existing demo error');
            return {
              success: false,
              error: 'Failed to create test videos for existing demo',
              code: ServiceErrorCode.DATABASE_ERROR
            };
          }
        }

        return {
          success: true,
          data: { demoId: testDemoId, videosCreated: existingVideos?.length || 4 }
        };
      }

      // Create the demo
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .insert({
          id: testDemoId,
          name: demoName,
          user_id: testUserId,
          tavus_persona_id: null,
          video_storage_path: 'test-videos/',
          metadata: {
            uploadId: testDemoId,
            userId: testUserId,
            fileName: 'test-demo.json',
            fileType: 'application/json',
            fileSize: '1024',
            uploadTimestamp: new Date().toISOString(),
            agentName: 'Test Agent',
            agentPersonality: 'Helpful and knowledgeable',
            agentGreeting: 'Hello! I can help you with demo videos.'
          }
        })
        .select()
        .single();

      if (demoError) {
        logError(demoError, 'Demo creation error');
        return {
          success: false,
          error: 'Failed to create demo',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      // Create test videos
      const testVideos = params?.videos ? 
        params.videos.map((video, index) => ({
          demo_id: testDemoId,
          ...video,
          order_index: video.order_index || index + 1
        })) :
        this.getDefaultTestVideos(testDemoId);

      const { data: videos, error: videosError } = await supabase
        .from('demo_videos')
        .insert(testVideos)
        .select();

      if (videosError) {
        logError(videosError, 'Videos creation error');
        return {
          success: false,
          error: 'Failed to create videos',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: { demoId: testDemoId, videosCreated: videos?.length || 0 }
      };

    } catch (error) {
      logError(error, 'Test demo creation error');
      return {
        success: false,
        error: 'Internal error creating test demo',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get knowledge base content for a demo
   */
  async getKnowledgeBase(demoId: string): Promise<ServiceResult<KnowledgeChunk[]>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: knowledgeChunks, error: knowledgeError } = await supabase
        .from('knowledge_chunks')
        .select('content, chunk_type, source')
        .eq('demo_id', demoId);

      if (knowledgeError) {
        logError(knowledgeError, 'Error fetching knowledge base');
        return {
          success: false,
          error: 'Failed to fetch knowledge base',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: (knowledgeChunks || []) as KnowledgeChunk[]
      };

    } catch (error) {
      logError(error, 'Error getting knowledge base');
      return {
        success: false,
        error: 'Internal error getting knowledge base',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get demo videos
   */
  async getDemoVideos(demoId: string): Promise<ServiceResult<DemoVideo[]>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: demoVideos, error: videosError } = await supabase
        .from('demo_videos')
        .select('title, transcript, storage_url, order_index, duration_seconds')
        .eq('demo_id', demoId)
        .eq('processing_status', 'completed')
        .order('order_index');

      if (videosError) {
        logError(videosError, 'Error fetching demo videos');
        return {
          success: false,
          error: 'Failed to fetch demo videos',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: (demoVideos || []) as DemoVideo[]
      };

    } catch (error) {
      logError(error, 'Error getting demo videos');
      return {
        success: false,
        error: 'Internal error getting demo videos',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get default test videos for demo creation
   */
  private getDefaultTestVideos(demoId: string) {
    return [
      {
        demo_id: demoId,
        title: 'First Video',
        storage_url: 'test-videos/first-video.mp4',
        order_index: 1,
        duration_seconds: 120
      },
      {
        demo_id: demoId,
        title: 'Second Video',
        storage_url: 'test-videos/second-video.mp4',
        order_index: 2,
        duration_seconds: 180
      },
      {
        demo_id: demoId,
        title: 'Third Video',
        storage_url: 'test-videos/third-video.mp4',
        order_index: 3,
        duration_seconds: 150
      },
      {
        demo_id: demoId,
        title: 'Fourth Video',
        storage_url: 'test-videos/fourth-video.mp4',
        order_index: 4,
        duration_seconds: 200
      }
    ];
  }
}

// Export singleton instance
export const demoLifecycleService = new DemoLifecycleService();