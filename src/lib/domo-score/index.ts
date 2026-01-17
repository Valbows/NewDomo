/**
 * ============================================================================
 * DOMO SCORE SERVICE - CENTRALIZED DATA COLLECTION
 * ============================================================================
 *
 * ⚠️  DEVELOPER WARNING ⚠️
 *
 * This service is the ONLY authorized way to write data that affects Domo Score.
 * DO NOT write directly to these tables from other parts of the codebase:
 *   - qualification_data
 *   - product_interest_data
 *   - video_showcase_data
 *   - cta_tracking
 *
 * If you need to track data for Domo Score, use this service:
 *   import { DomoScoreService } from '@/lib/domo-score';
 *
 * The Domo Score calculation depends on data integrity. Direct writes to these
 * tables may break the score or cause inconsistencies.
 *
 * Score Criteria (5 points total):
 *   1. Contact Confirmation (1 pt) - Email, first name, or last name
 *   2. Reason For Visit (1 pt) - Primary interest or pain points
 *   3. Platform Feature Interest (1 pt) - Videos shown during conversation
 *   4. CTA Execution (1 pt) - CTA button clicked
 *   5. Perception Analysis (1 pt) - Valid visual perception data
 *
 * ============================================================================
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/debug-logger';

// Re-export the score calculation utilities
export {
  calculateDomoScore,
  isValidPerceptionAnalysis,
  getScoreColor,
  getScoreLabel,
} from '@/app/demos/[demoId]/configure/components/reporting/utils/domo-score';

// Re-export types
export type {
  DomoScoreBreakdown,
  DomoScoreResult,
} from '@/app/demos/[demoId]/configure/components/reporting/types';

/**
 * Contact information for qualification tracking
 */
export interface ContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
}

/**
 * Product interest data from conversation
 */
export interface InterestData {
  primaryInterest?: string;
  painPoints?: string[];
}

/**
 * Video showcase tracking data
 */
export interface VideoData {
  videoTitle: string;
  videoUrl?: string;
  watchedDuration?: number;
}

/**
 * CTA tracking data
 */
export interface CTAData {
  ctaShown: boolean;
  ctaClicked: boolean;
  ctaUrl?: string;
}

/**
 * DomoScoreService - Centralized service for all Domo Score data collection
 *
 * Usage:
 *   const service = new DomoScoreService(supabaseClient);
 *   await service.trackContact(conversationId, demoId, { email: 'user@example.com' });
 */
export class DomoScoreService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Track contact information (affects Contact Confirmation score)
   *
   * Call this when:
   * - User provides email, name, or position during conversation
   * - Objective completion webhook fires with contact data
   */
  async trackContact(
    conversationId: string,
    demoId: string,
    data: ContactData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('qualification_data')
        .upsert(
          {
            tavus_conversation_id: conversationId,
            demo_id: demoId,
            first_name: data.firstName || null,
            last_name: data.lastName || null,
            email: data.email || null,
            position: data.position || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tavus_conversation_id' }
        );

      if (error) {
        logger.warn('[DomoScoreService] Failed to track contact', { error, conversationId });
        return { success: false, error: error.message };
      }

      logger.info('[DomoScoreService] Contact tracked', { conversationId, hasEmail: !!data.email });
      return { success: true };
    } catch (err: any) {
      logger.warn('[DomoScoreService] Error tracking contact', { error: err });
      return { success: false, error: err.message };
    }
  }

  /**
   * Track product interest (affects Reason For Visit score)
   *
   * Call this when:
   * - User expresses interest in a feature/product
   * - User mentions pain points
   * - Objective completion webhook fires with interest data
   */
  async trackInterest(
    conversationId: string,
    demoId: string,
    data: InterestData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('product_interest_data')
        .upsert(
          {
            tavus_conversation_id: conversationId,
            demo_id: demoId,
            primary_interest: data.primaryInterest || null,
            pain_points: data.painPoints || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tavus_conversation_id' }
        );

      if (error) {
        logger.warn('[DomoScoreService] Failed to track interest', { error, conversationId });
        return { success: false, error: error.message };
      }

      logger.info('[DomoScoreService] Interest tracked', { conversationId, hasInterest: !!data.primaryInterest });
      return { success: true };
    } catch (err: any) {
      logger.warn('[DomoScoreService] Error tracking interest', { error: err });
      return { success: false, error: err.message };
    }
  }

  /**
   * Track video view (affects Platform Feature Interest score)
   *
   * Call this when:
   * - A video is played during the conversation
   * - Video playback completes
   */
  async trackVideoView(
    conversationId: string,
    demoId: string,
    data: VideoData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get existing videos
      const { data: existing } = await this.supabase
        .from('video_showcase_data')
        .select('videos_shown')
        .eq('tavus_conversation_id', conversationId)
        .single();

      const existingVideos: string[] = existing?.videos_shown || [];
      const updatedVideos = existingVideos.includes(data.videoTitle)
        ? existingVideos
        : [...existingVideos, data.videoTitle];

      const { error } = await this.supabase
        .from('video_showcase_data')
        .upsert(
          {
            tavus_conversation_id: conversationId,
            demo_id: demoId,
            videos_shown: updatedVideos,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tavus_conversation_id' }
        );

      if (error) {
        logger.warn('[DomoScoreService] Failed to track video', { error, conversationId });
        return { success: false, error: error.message };
      }

      logger.info('[DomoScoreService] Video tracked', { conversationId, videoTitle: data.videoTitle });
      return { success: true };
    } catch (err: any) {
      logger.warn('[DomoScoreService] Error tracking video', { error: err });
      return { success: false, error: err.message };
    }
  }

  /**
   * Track CTA interaction (affects CTA Execution score)
   *
   * Call this when:
   * - CTA is shown to user
   * - User clicks the CTA button
   */
  async trackCTA(
    conversationId: string,
    demoId: string,
    data: CTAData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        tavus_conversation_id: conversationId,
        demo_id: demoId,
        updated_at: new Date().toISOString(),
      };

      if (data.ctaShown) {
        updateData.cta_shown_at = new Date().toISOString();
      }

      if (data.ctaClicked) {
        updateData.cta_clicked_at = new Date().toISOString();
      }

      if (data.ctaUrl) {
        updateData.cta_url = data.ctaUrl;
      }

      const { error } = await this.supabase
        .from('cta_tracking')
        .upsert(updateData, { onConflict: 'tavus_conversation_id' });

      if (error) {
        logger.warn('[DomoScoreService] Failed to track CTA', { error, conversationId });
        return { success: false, error: error.message };
      }

      logger.info('[DomoScoreService] CTA tracked', {
        conversationId,
        shown: data.ctaShown,
        clicked: data.ctaClicked
      });
      return { success: true };
    } catch (err: any) {
      logger.warn('[DomoScoreService] Error tracking CTA', { error: err });
      return { success: false, error: err.message };
    }
  }

  /**
   * Update perception analysis (affects Perception Analysis score)
   *
   * Call this when:
   * - Webhook receives perception analysis data
   * - Sync endpoint fetches perception from Tavus API
   */
  async updatePerceptionAnalysis(
    conversationId: string,
    perceptionData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('conversation_details')
        .update({
          perception_analysis: perceptionData,
          updated_at: new Date().toISOString(),
        })
        .eq('tavus_conversation_id', conversationId);

      if (error) {
        logger.warn('[DomoScoreService] Failed to update perception', { error, conversationId });
        return { success: false, error: error.message };
      }

      logger.info('[DomoScoreService] Perception updated', { conversationId });
      return { success: true };
    } catch (err: any) {
      logger.warn('[DomoScoreService] Error updating perception', { error: err });
      return { success: false, error: err.message };
    }
  }
}

/**
 * Create a DomoScoreService instance with the provided Supabase client
 */
export function createDomoScoreService(supabaseClient: SupabaseClient): DomoScoreService {
  return new DomoScoreService(supabaseClient);
}
