/**
 * Metrics Collection Service
 * 
 * Handles analytics data collection, sanitization, and ingestion operations.
 */

import {TavusClient, createTavusClient} from './tavus-client';
import {ServiceResult, WebhookEvent} from './types';

export class MetricsCollectionService {
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
      // console.error('Error checking if event should be ingested:', error);
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
      // console.error('Error ingesting analytics event:', error);
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
        // console.warn(`No demo found for conversation ${conversationId}`);
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

        return {
          success: true, // Not an error, just no data to store
        };
      }

      // console.log(`- Transcript entries: ${transcript ? (Array.isArray(transcript) ? transcript.length : 'present') : 'none'}`);

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

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error storing detailed conversation data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new metrics collection service instance
 */
export function createMetricsCollectionService(client?: TavusClient): MetricsCollectionService {
  return new MetricsCollectionService(client);
}