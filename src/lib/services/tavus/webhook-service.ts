/**
 * Tavus Webhook Service
 * Business logic for webhook processing and management
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { 
  WebhookEvent, 
  ToolCallEvent, 
  ObjectiveCompletionEvent, 
  ServiceResult,
  WebhookUrlStatus,
  VideoRequest,
  VideoResponse,
  CTAEvent,
  CTAConfig
} from './types';

export class WebhookService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Parse tool call from webhook event
   */
  parseToolCallFromEvent(event: WebhookEvent): { toolName: string | null; toolArgs: any } {
    try {
      // Import the tool parser dynamically to avoid circular dependencies
      const { parseToolCallFromEvent } = require('../../tools/toolParser');
      return parseToolCallFromEvent(event);
    } catch (error) {
      console.error('Error parsing tool call:', error);
      return { toolName: null, toolArgs: {} };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    rawBody: string, 
    signature: string | null, 
    secret: string
  ): boolean {
    try {
      // Import the verification function dynamically
      const { verifyHmacSha256Signature } = require('../../security/webhooks');
      return verifyHmacSha256Signature(rawBody, signature, secret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook token
   */
  verifyWebhookToken(tokenParam: string | null, tokenEnv: string): boolean {
    return !!tokenEnv && !!tokenParam && tokenParam === tokenEnv;
  }

  /**
   * Process video request tool call
   */
  async processVideoRequest(
    request: VideoRequest,
    supabase: any
  ): Promise<ServiceResult<VideoResponse>> {
    try {
      const { video_title, demo_id, conversation_id } = request;

      // Validate video title
      if (!video_title || typeof video_title !== 'string' || !video_title.trim()) {
        console.warn('🚨 GUARDRAIL VIOLATION: Invalid video title in tool call', {
          conversation_id,
          video_title,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: false,
          error: 'Invalid or missing video title',
        };
      }

      // Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found for conversation',
        };
      }

      // Find the video in that demo
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demo.id)
        .eq('title', video_title)
        .single();

      if (videoError || !video) {
        // Log available videos for debugging
        const { data: availableVideos } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demo.id);
        console.log('Available videos in demo:', availableVideos?.map((v: any) => v.title));
        
        return {
          success: false,
          error: 'Video not found',
        };
      }

      // Generate a signed URL for the video
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
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
      console.error('Error processing video request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process CTA display tool call
   */
  async processCTADisplay(
    conversationId: string,
    supabase: any
  ): Promise<ServiceResult<CTAEvent>> {
    try {
      // Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id, cta_title, cta_message, cta_button_text, cta_button_url')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found for conversation',
        };
      }

      const ctaConfig: CTAConfig = {
        title: demo.cta_title,
        message: demo.cta_message,
        button_text: demo.cta_button_text,
        button_url: demo.cta_button_url,
      };

      const ctaEvent: CTAEvent = {
        conversation_id: conversationId,
        demo_id: demo.id,
        cta_config: ctaConfig,
        shown_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: ctaEvent,
      };
    } catch (error) {
      console.error('Error processing CTA display:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Track CTA shown event
   */
  async trackCTAShown(
    ctaEvent: CTAEvent,
    supabase: any
  ): Promise<ServiceResult<void>> {
    try {
      // Check for existing CTA tracking record
      const { data: existingCta } = await supabase
        .from('cta_tracking')
        .select('id, cta_url')
        .eq('conversation_id', ctaEvent.conversation_id)
        .single();

      const now = new Date().toISOString();
      
      if (existingCta?.id) {
        // Update existing record
        const { error: updateErr } = await supabase
          .from('cta_tracking')
          .update({
            cta_shown_at: now,
            cta_url: ctaEvent.cta_config.button_url ?? existingCta.cta_url ?? null,
            updated_at: now,
          })
          .eq('id', existingCta.id);

        if (updateErr) {
          return {
            success: false,
            error: 'Failed to update CTA tracking',
          };
        }
      } else {
        // Insert new record
        const { error: insertErr } = await supabase
          .from('cta_tracking')
          .insert({
            conversation_id: ctaEvent.conversation_id,
            demo_id: ctaEvent.demo_id,
            cta_shown_at: now,
            cta_url: ctaEvent.cta_config.button_url ?? null,
            updated_at: now,
          });

        if (insertErr) {
          return {
            success: false,
            error: 'Failed to insert CTA tracking',
          };
        }
      }

      console.log(`✅ Tracked CTA shown for conversation ${ctaEvent.conversation_id}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error tracking CTA shown:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Track video showcase data
   */
  async trackVideoShowcase(
    conversationId: string,
    demoId: string,
    videoTitle: string,
    supabase: any
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

      console.log(`✅ Tracked video showcase for ${conversationId}: ${videoTitle}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error tracking video showcase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get webhook URL status
   */
  getWebhookUrlStatus(): WebhookUrlStatus {
    const webhookUrl = this.getWebhookUrl();
    const isNgrok = webhookUrl.includes('ngrok');
    const isLocalhost = webhookUrl.includes('localhost');
    
    return {
      webhookUrl,
      isNgrok,
      isLocalhost,
      isProduction: !isNgrok && !isLocalhost,
      warning: isNgrok ? 'Using ngrok URL - remember to update when ngrok restarts' : undefined,
    };
  }

  /**
   * Get webhook URL
   */
  getWebhookUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    return `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;
  }

  /**
   * Validate webhook URL accessibility
   */
  async validateWebhookUrl(url?: string): Promise<boolean> {
    const webhookUrl = url || this.getWebhookUrl();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(webhookUrl.replace('?t=', '?test=true&t='), {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return response.status === 200 || response.status === 405; // 405 is OK (method not allowed for HEAD)
    } catch (error) {
      console.warn(`⚠️ Webhook URL validation failed: ${error}`);
      return false;
    }
  }
}

/**
 * Create a new webhook service instance
 */
export function createWebhookService(client?: TavusClient): WebhookService {
  return new WebhookService(client);
}