/**
 * ============================================================================
 * ⚠️  DOMO SCORE DEPENDENCY - DO NOT MODIFY WITHOUT TESTING SCORE ⚠️
 * ============================================================================
 *
 * This webhook handler processes events that affect multiple Domo Score criteria:
 *   - Objective completions → qualification_data, product_interest_data
 *   - Tool calls (fetch_video, show_trial_cta) → video_showcase_data, cta_tracking
 *   - Perception analysis → conversation_details
 *
 * Before modifying this handler:
 *   1. Run existing tests: npm run test:all
 *   2. After changes, verify Domo Score still calculates correctly
 *   3. Test with real Tavus webhook events
 *
 * See: src/lib/domo-score/index.ts for centralized Domo Score documentation
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage, logError } from '@/lib/errors';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';
import { shouldIngestEvent, ingestAnalyticsForEvent } from '@/lib/tavus/webhook_ingest';
import { verifyWebhookAuthentication } from './utils/authentication';
import { checkAndRecordIdempotency } from './utils/idempotency';
import { broadcastToDemo } from './utils/broadcast';
import { storeDetailedConversationData } from './utils/conversationData';
import { handleProductInterestDiscovery, handleContactInfoCollection, handleVideoShowcaseObjective } from './handlers/objectiveHandlers';
import { handleFetchVideo, handleShowTrialCTA } from './handlers/toolCallHandlers';

// Testable handler for Tavus webhook; used by tests directly and by the route wrapper.
export async function handlePOST(req: NextRequest) {
  // Create Supabase client with service role for webhook authentication
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    // Verify webhook authenticity
    const { authenticated, rawBody } = await verifyWebhookAuthentication(req);
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    const conversation_id = event.conversation_id;
    const { toolName, toolArgs } = parseToolCallFromEvent(event);

    // Idempotency guard for tool-call events only (prevents duplicate broadcasts)
    if (toolName) {
      const isDuplicate = await checkAndRecordIdempotency(supabase, event, rawBody);
      if (isDuplicate) {
        return NextResponse.json({ received: true });
      }
    }

    // Handle transcription_ready and perception_analysis events specifically
    // These can arrive after the conversation ends, so we look up by conversation_id directly
    if (event.event_type === 'application.transcription_ready' ||
        event.event_type === 'application.perception_analysis') {

      try {
        const updateData: any = {};

        if (event.event_type === 'application.transcription_ready') {
          const transcript = event.properties?.transcript || event.data?.transcript || null;
          if (transcript) {
            updateData.transcript = transcript;
          }
        }

        if (event.event_type === 'application.perception_analysis') {
          const perception = event.properties?.analysis || event.data?.analysis || null;
          if (perception) {
            updateData.perception_analysis = perception;
          }
        }

        if (Object.keys(updateData).length > 0) {
          // Update directly by tavus_conversation_id (doesn't need demo lookup)
          const { error } = await supabase
            .from('conversation_details')
            .update(updateData)
            .eq('tavus_conversation_id', conversation_id);

          if (error) {
            console.warn(`Failed to update conversation_details:`, error);
          } else {
          }
        }

        return NextResponse.json({ received: true });
      } catch (err) {
        logError(err, `Error handling ${event.event_type}`);
        return NextResponse.json({ received: true });
      }
    }

    // Handle conversation ended/completed events - mark conversation as ended
    const isConversationEnded =
      event.event_type === 'conversation.ended' ||
      event.event_type === 'conversation_ended' ||
      event.event_type === 'application.conversation_ended' ||
      event.event_type === 'conversation.completed' ||
      event.event_type === 'conversation_completed' ||
      event.event_type === 'application.conversation_completed';

    if (isConversationEnded) {
      try {
        const { error: updateError } = await supabase
          .from('conversation_details')
          .update({
            status: 'ended',
            completed_at: new Date().toISOString(),
          })
          .eq('tavus_conversation_id', conversation_id);

        if (updateError) {
          console.warn(`Failed to mark conversation ${conversation_id} as ended:`, updateError);
        }

        // Also do analytics ingestion for the ended event
        if (shouldIngestEvent(event)) {
          await ingestAnalyticsForEvent(supabase, conversation_id, event);
          await storeDetailedConversationData(supabase, conversation_id, event);
          await broadcastAnalyticsUpdate(supabase, conversation_id, event);
        }

        return NextResponse.json({ received: true });
      } catch (err) {
        logError(err, 'Error handling conversation ended event');
        return NextResponse.json({ received: true });
      }
    }

    // If there is no tool call, check if it's an objective completion or analytics event
    if (!toolName) {
      // Check if this is an objective completion event first
      const isObjectiveCompletion = event.event_type === 'application.objective_completed' ||
                                   event.event_type === 'objective_completed' ||
                                   event.event_type === 'conversation.objective.completed';

      if (!isObjectiveCompletion) {
        // Only do analytics ingestion for non-objective events
        try {
          if (!shouldIngestEvent(event)) {
            return NextResponse.json({ received: true });
          }

          // Store in legacy format (metadata.analytics) for backward compatibility
          await ingestAnalyticsForEvent(supabase, conversation_id, event);

          // ALSO store in detailed conversation_details table
          await storeDetailedConversationData(supabase, conversation_id, event);

          // After successful ingestion, broadcast an update so UIs can refresh reporting in real-time
          await broadcastAnalyticsUpdate(supabase, conversation_id, event);

          return NextResponse.json({ received: true });
        } catch (ingestErr) {
          logError(ingestErr, 'Webhook Ingest Error');
          return NextResponse.json({ received: true });
        }
      }
      // If it is an objective completion, continue to the objective processing below
    }

    // Handle objective completion events
    if (isObjectiveCompletionEvent(event)) {
      return await handleObjectiveCompletion(supabase, conversation_id, event);
    }

    // Process tool calls
    if (toolName === 'fetch_video' || toolName === 'play_video') {
      const videoTitle = extractVideoTitle(toolArgs);
      return await handleFetchVideo(supabase, conversation_id, videoTitle);
    } else if (toolName === 'show_trial_cta') {
      return await handleShowTrialCTA(supabase, conversation_id);
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    logError(error, 'Tavus Webhook Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isObjectiveCompletionEvent(event: any): boolean {
  return event.event_type === 'application.objective_completed' ||
         event.event_type === 'objective_completed' ||
         event.event_type === 'conversation.objective.completed';
}

function extractVideoTitle(toolArgs: any): string {
  const candidateTitle = (
    toolArgs?.video_title ||
    toolArgs?.title ||
    toolArgs?.videoName ||
    toolArgs?.video_name ||
    (typeof toolArgs === 'string' ? toolArgs : null)
  ) as string | null;
  return typeof candidateTitle === 'string' ? candidateTitle.trim().replace(/^['"]|['"]$/g, '') : '';
}

async function handleObjectiveCompletion(
  supabase: any,
  conversationId: string,
  event: any
): Promise<NextResponse> {
  const objectiveName = event?.properties?.objective_name || event?.data?.objective_name || event?.objective_name;
  const outputVariables = event?.properties?.output_variables || event?.data?.output_variables || event?.output_variables || {};

  // Ensure a conversation_details record exists for this conversation
  // This is critical for the reporting page to show the conversation
  await ensureConversationDetailsRecord(supabase, conversationId);

  if (objectiveName === 'product_interest_discovery') {
    await handleProductInterestDiscovery(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'contact_information_collection' || objectiveName === 'greeting_and_qualification') {
    await handleContactInfoCollection(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'demo_video_showcase') {
    await handleVideoShowcaseObjective(supabase, conversationId, outputVariables, event);
  }

  return NextResponse.json({ received: true });
}

async function ensureConversationDetailsRecord(
  supabase: any,
  conversationId: string
): Promise<void> {
  try {
    // Check if conversation_details record already exists
    const { data: existingRecord } = await supabase
      .from('conversation_details')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (existingRecord) {
      return;
    }

    // Find the demo associated with this conversation
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoError || !demo) {
      console.warn(`No demo found for conversation ${conversationId}, cannot create conversation_details record`);
      return;
    }

    // Create a minimal conversation_details record
    const { error: insertError } = await supabase
      .from('conversation_details')
      .insert({
        demo_id: demo.id,
        tavus_conversation_id: conversationId,
        conversation_name: `Conversation ${conversationId.slice(-8)}`,
        status: 'active',
        started_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`❌ Failed to create conversation_details record:`, insertError);
    } else {
    }
  } catch (error) {
    console.error(`❌ Error ensuring conversation_details record:`, error);
  }
}

async function broadcastAnalyticsUpdate(
  supabase: any,
  conversationId: string,
  event: any
): Promise<void> {
  try {
    const { data: demoForBroadcast } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoForBroadcast?.id) {
      await broadcastToDemo(supabase, demoForBroadcast.id, 'analytics_updated', {
        conversation_id: conversationId,
        event_type: event?.event_type || event?.type || null,
      });
    }
  } catch (broadcastErr) {
    console.warn('Webhook: analytics_updated broadcast failed (non-fatal):', broadcastErr);
  }
}
