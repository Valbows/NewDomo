/**
 * Tavus Analytics Service
 * Business logic for analytics processing and sanitization
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { 
  AnalyticsEvent, 
  ConversationAnalytics, 
  ServiceResult,
  WebhookEvent 
} from './types';

export class AnalyticsService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Sanitize analytics payload for storage
   */
  sanitizeAnalyticsPayload(input: any): any {
    const PRUNE_KEYS = new Set([
      'transcript',
      'utterances',
      'messages',
      'raw',
      'audio',
      'media',
      'video',
      'frames',
    ]);
    const REDACT_KEYS = ['email', 'phone', 'name', 'user', 'speaker'];
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

    const walk = (val: any): any => {
      if (val == null) return val;
      if (typeof val === 'string') {
        return val.replace(emailRegex, '[REDACTED_EMAIL]').replace(phoneRegex, '[REDACTED_PHONE]');
      }
      if (Array.isArray(val)) {
        return val.slice(0, 50).map(walk); // cap arrays to avoid huge payloads
      }
      if (typeof val === 'object') {
        const out: Record<string, any> = {};
        const keys = Object.keys(val).slice(0, 100); // cap object keys
        for (const k of keys) {
          if (PRUNE_KEYS.has(k)) {
            out[k] = '[REDACTED]';
            continue;
          }
          if (REDACT_KEYS.some((rk) => k.toLowerCase().includes(rk))) {
            out[k] = '[REDACTED]';
            continue;
          }
          out[k] = walk((val as any)[k]);
        }
        return out;
      }
      return val;
    };

    return walk(input);
  }

  /**
   * Check if event should be ingested for analytics
   */
  shouldIngestEvent(event: WebhookEvent): boolean {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { shouldIngestEvent } = require('../../tavus/webhook_ingest');
      return shouldIngestEvent(event);
    } catch (error) {
      console.error('Error checking if event should be ingested:', error);
      return false;
    }
  }

  /**
   * Ingest analytics event
   */
  async ingestAnalyticsEvent(
    supabase: any,
    conversationId: string,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { ingestAnalyticsForEvent } = require('../../tavus/webhook_ingest');
      await ingestAnalyticsForEvent(supabase, conversationId, event);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error ingesting analytics event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store detailed conversation data
   */
  async storeDetailedConversationData(
    supabase: any,
    conversationId: string,
    event: WebhookEvent
  ): Promise<ServiceResult<void>> {
    try {
      if (!conversationId) {
        return {
          success: false,
          error: 'Conversation ID is required',
        };
      }

      // Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (demoError || !demo) {
        console.warn(`No demo found for conversation ${conversationId}`);
        return {
          success: false,
          error: 'Demo not found for conversation',
        };
      }

      // Extract transcript and perception data from the webhook event
      let transcript = event?.data?.transcript || 
                       event?.transcript || 
                       event?.data?.messages ||
                       event?.messages ||
                       null;
                       
      let perceptionAnalysis = event?.data?.perception || 
                              event?.perception ||
                              event?.data?.analysis ||
                              event?.analysis ||
                              event?.data?.analytics ||
                              event?.analytics ||
                              null;

      // Also check if data is in events array format (like API response)
      const events = (event as any)?.events || event?.data?.events || [];
      if (events.length > 0) {
        const transcriptEvent = events.find((e: any) => 
          e.event_type === 'application.transcription_ready'
        );
        if (transcriptEvent?.properties?.transcript) {
          transcript = transcriptEvent.properties.transcript;
        }
        
        const perceptionEvent = events.find((e: any) => 
          e.event_type === 'application.perception_analysis'
        );
        if (perceptionEvent?.properties?.analysis) {
          perceptionAnalysis = perceptionEvent.properties.analysis;
        }
      }

      // Only update if we have transcript or perception data
      if (!transcript && !perceptionAnalysis) {
        console.log('No transcript or perception data in webhook event');
        return {
          success: true, // Not an error, just no data to store
        };
      }

      console.log(`📊 Storing detailed conversation data for ${conversationId}:`);
      console.log(`- Transcript entries: ${transcript ? (Array.isArray(transcript) ? transcript.length : 'present') : 'none'}`);
      console.log(`- Perception data: ${perceptionAnalysis ? 'present' : 'none'}`);

      // Upsert the conversation details
      const { error: upsertError } = await supabase
        .from('conversation_details')
        .upsert({
          tavus_conversation_id: conversationId,
          demo_id: demo.id,
          transcript: transcript,
          perception_analysis: perceptionAnalysis,
          status: 'completed', // Mark as completed when we receive webhook
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'tavus_conversation_id'
        });

      if (upsertError) {
        return {
          success: false,
          error: 'Failed to store detailed conversation data',
        };
      }

      console.log('✅ Successfully stored detailed conversation data');
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing detailed conversation data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
      
      console.log(`🎯 Processing objective completion: ${objectiveName}`);
      console.log(`📊 Output variables:`, JSON.stringify(outputVariables, null, 2));
      
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
      console.error('Error processing objective completion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store product interest data
   */
  private async storeProductInterestData(
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

      console.log('✅ Successfully stored product interest data');
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing product interest data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store qualification data
   */
  private async storeQualificationData(
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

      console.log('✅ Successfully stored qualification data');
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing qualification data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store video showcase data
   */
  private async storeVideoShowcaseData(
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

        console.log('✅ Successfully updated video showcase data for objective');
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

        console.log('✅ Successfully inserted video showcase data for objective');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing video showcase data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new analytics service instance
 */
export function createAnalyticsService(client?: TavusClient): AnalyticsService {
  return new AnalyticsService(client);
}