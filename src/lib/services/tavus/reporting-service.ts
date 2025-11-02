/**
 * Reporting Service
 * 
 * Handles objective completion processing and specialized data storage for reporting.
 */

import {TavusClient, createTavusClient} from './tavus-client';
import {ServiceResult, WebhookEvent} from './types';

export class ReportingService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Process objective completion event
   */
  async processObjectiveCompletion(
    supabase: any,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      const conversationId = event.conversation_id;
      if (!conversationId) {
        return {
          success: false,
          error: 'No conversation ID found in objective completion event',
        };
      }

      const objectiveName = event?.properties?.objective_name || 
                           event?.data?.objective_name || 
                           (event as any)?.objective_name;
      const outputVariables = event?.properties?.output_variables || 
                             event?.data?.output_variables || 
                             (event as any)?.output_variables || {};

      // console.log(`📊 Output variables:`, JSON.stringify(outputVariables, null, 2));
      
      if (objectiveName === 'product_interest_discovery') {
        return await this.storeProductInterestData(supabase, conversationId, objectiveName, outputVariables, event);
      } else if (objectiveName === 'contact_information_collection' || objectiveName === 'greeting_and_qualification') {
        return await this.storeQualificationData(supabase, conversationId, objectiveName, outputVariables, event);
      } else if (objectiveName === 'demo_video_showcase') {
        return await this.storeVideoShowcaseData(supabase, conversationId, objectiveName, outputVariables, event);
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error processing objective completion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store product interest data
   */
  async storeProductInterestData(
    supabase: any,
    conversationId: string,
    objectiveName: string,
    outputVariables: any,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      // Handle pain_points - convert to array if it's a string
      let painPointsArray = null;
      if (outputVariables.pain_points) {
        if (Array.isArray(outputVariables.pain_points)) {
          painPointsArray = outputVariables.pain_points;
        } else if (typeof outputVariables.pain_points === 'string') {
          painPointsArray = [outputVariables.pain_points];
        }
      }

      const { error: insertError } = await supabase
        .from('product_interest_data')
        .insert({
          conversation_id: conversationId,
          objective_name: objectiveName,
          primary_interest: outputVariables.primary_interest || null,
          pain_points: painPointsArray,
          event_type: event.event_type,
          raw_payload: event,
          received_at: new Date().toISOString()
        });

      if (insertError) {
        return {
          success: false,
          error: 'Failed to store product interest data',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error storing product interest data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store qualification data
   */
  async storeQualificationData(
    supabase: any,
    conversationId: string,
    objectiveName: string,
    outputVariables: any,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      const { error: insertError } = await supabase
        .from('qualification_data')
        .insert({
          conversation_id: conversationId,
          first_name: outputVariables.first_name || null,
          last_name: outputVariables.last_name || null,
          email: outputVariables.email || null,
          position: outputVariables.position || null,
          objective_name: objectiveName,
          event_type: event.event_type,
          raw_payload: event,
          received_at: new Date().toISOString()
        });

      if (insertError) {
        return {
          success: false,
          error: 'Failed to store qualification data',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error storing qualification data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store video showcase data
   */
  async storeVideoShowcaseData(
    supabase: any,
    conversationId: string,
    objectiveName: string,
    outputVariables: any,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      // Normalize arrays
      const req = outputVariables?.requested_videos;
      const shown = outputVariables?.videos_shown;
      const requestedArray = Array.isArray(req) ? req : (typeof req === 'string' ? [req] : null);
      const shownArray = Array.isArray(shown) ? shown : (typeof shown === 'string' ? [shown] : null);

      // Read existing record (if any)
      const { data: existingShowcase } = await supabase
        .from('video_showcase_data')
        .select('id, requested_videos, videos_shown')
        .eq('conversation_id', conversationId)
        .single();

      const prevRequested = Array.isArray(existingShowcase?.requested_videos)
        ? (existingShowcase!.requested_videos as string[])
        : [];
      const prevShown = Array.isArray(existingShowcase?.videos_shown)
        ? (existingShowcase!.videos_shown as string[])
        : [];

      const updatedRequested = Array.from(new Set([...(prevRequested || []), ...(requestedArray || [])].filter(Boolean)));
      const updatedShown = Array.from(new Set([...(prevShown || []), ...(shownArray || [])].filter(Boolean)));

      const payload = {
        conversation_id: conversationId,
        objective_name: 'demo_video_showcase',
        requested_videos: updatedRequested.length ? updatedRequested : null,
        videos_shown: updatedShown.length ? updatedShown : null,
        event_type: event.event_type,
        raw_payload: event,
        received_at: new Date().toISOString(),
      } as any;

      if (existingShowcase?.id) {
        const { error: updateErr } = await supabase
          .from('video_showcase_data')
          .update({
            requested_videos: payload.requested_videos,
            videos_shown: payload.videos_shown,
            raw_payload: payload.raw_payload,
            received_at: payload.received_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingShowcase.id);

        if (updateErr) {
          return {
            success: false,
            error: 'Failed to update video showcase data',
          };
        }

      } else {
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
      // console.error('Error storing video showcase data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new reporting service instance
 */
export function createReportingService(client?: TavusClient): ReportingService {
  return new ReportingService(client);
}