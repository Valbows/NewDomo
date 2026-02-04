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
import {
  updateModuleStateOnObjectiveComplete,
  createInitialModuleState,
} from '@/lib/modules';
import type { ModuleId, ModuleState } from '@/lib/modules/types';

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
            console.warn('Failed to update conversation_details:', error);
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

        // ALWAYS broadcast conversation_ended for real-time UI updates
        // This allows frontends to immediately update their state
        await broadcastConversationEnded(supabase, conversation_id);

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

  // Handle specific objective types for scoring
  if (objectiveName === 'product_interest_discovery') {
    await handleProductInterestDiscovery(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'contact_information_collection' || objectiveName === 'greeting_and_qualification') {
    await handleContactInfoCollection(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'demo_video_showcase') {
    await handleVideoShowcaseObjective(supabase, conversationId, outputVariables, event);
  }

  // Update module state for ALL objective completions
  await updateModuleProgressOnObjective(supabase, conversationId, objectiveName);

  return NextResponse.json({ received: true });
}

/**
 * Update module progress when an objective completes.
 * Tracks current_module_id and module_state in conversation_details.
 */
async function updateModuleProgressOnObjective(
  supabase: any,
  conversationId: string,
  objectiveName: string
): Promise<void> {
  try {
    // Get current conversation details
    const { data: convDetails, error: fetchError } = await supabase
      .from('conversation_details')
      .select('demo_id, current_module_id, module_state')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (fetchError || !convDetails) {
      console.warn('Could not fetch conversation_details for module tracking:', fetchError);
      return;
    }

    const currentState = (convDetails.module_state as ModuleState | null) || createInitialModuleState();
    const currentModuleId = convDetails.current_module_id as ModuleId | null;

    // Update module state based on completed objective
    const { newState, newModuleId, moduleChanged, previousModuleId } =
      updateModuleStateOnObjectiveComplete(currentState, currentModuleId, objectiveName);

    // Update conversation_details with new module state
    const { error: updateError } = await supabase
      .from('conversation_details')
      .update({
        current_module_id: newModuleId,
        module_state: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('tavus_conversation_id', conversationId);

    if (updateError) {
      console.error('Failed to update module state:', updateError);
      return;
    }

    // Broadcast events for frontend updates
    if (convDetails.demo_id) {
      // Always broadcast objective completion
      await broadcastToDemo(supabase, convDetails.demo_id, 'objective_completed', {
        objectiveName,
        currentModule: newModuleId,
        completedObjectives: newState.completedObjectives,
      });

      // Broadcast module change if we advanced to a new module
      if (moduleChanged) {
        await broadcastToDemo(supabase, convDetails.demo_id, 'module_changed', {
          previousModule: previousModuleId,
          currentModule: newModuleId,
          completedModules: newState.completedModules,
          completedObjectives: newState.completedObjectives,
        });
      }
    }
  } catch (error) {
    // Non-fatal - log but don't fail the webhook
    console.error('Error updating module progress:', error);
  }
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
      .select('id, name')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoError || !demo) {
      console.warn(`No demo found for conversation ${conversationId}, cannot create conversation_details record`);
      return;
    }

    // Create a minimal conversation_details record with proper demo name format
    // Initialize with empty module_state for module tracking
    const { error: insertError } = await supabase
      .from('conversation_details')
      .insert({
        demo_id: demo.id,
        tavus_conversation_id: conversationId,
        conversation_name: `${demo.name || 'Demo'} - ${new Date().toLocaleString()}`,
        status: 'active',
        started_at: new Date().toISOString(),
        current_module_id: 'intro',  // Start at the intro module
        module_state: createInitialModuleState(),
      });

    if (insertError) {
      console.error('Failed to create conversation_details record:', insertError);
    } else {
    }
  } catch (error) {
    console.error('Error ensuring conversation_details record:', error);
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

async function broadcastConversationEnded(
  supabase: any,
  conversationId: string
): Promise<void> {
  try {
    // Try to find demo by tavus_conversation_id first
    let demoId: string | null = null;

    const { data: demoByConvId } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoByConvId?.id) {
      demoId = demoByConvId.id;
    } else {
      // Fallback: find demo via conversation_details
      const { data: convDetails } = await supabase
        .from('conversation_details')
        .select('demo_id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (convDetails?.demo_id) {
        demoId = convDetails.demo_id;
      }
    }

    if (demoId) {
      await broadcastToDemo(supabase, demoId, 'conversation_ended', {
        conversation_id: conversationId,
        ended_at: new Date().toISOString(),
      });
    }
  } catch (broadcastErr) {
    console.warn('Webhook: conversation_ended broadcast failed (non-fatal):', broadcastErr);
  }
}
