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

    console.log('=== TAVUS WEBHOOK EVENT RECEIVED ===');
    console.log('Event Type:', event.event_type);
    console.log('Conversation ID:', event.conversation_id);
    console.log('Full Event:', JSON.stringify(event, null, 2));
    console.log('=====================================');

    const conversation_id = event.conversation_id;
    const { toolName, toolArgs } = parseToolCallFromEvent(event);
    console.log('Parsed tool call from event:', toolName, toolArgs);

    // Idempotency guard for tool-call events only (prevents duplicate broadcasts)
    if (toolName) {
      const isDuplicate = await checkAndRecordIdempotency(supabase, event, rawBody);
      if (isDuplicate) {
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

  console.log(`🎯 Processing objective completion: ${objectiveName}`);
  console.log(`📊 Output variables:`, JSON.stringify(outputVariables, null, 2));
  console.log(`📋 Event structure:`, JSON.stringify({
    event_type: event.event_type,
    has_properties: !!event.properties,
    has_data: !!event.data,
    properties_keys: event.properties ? Object.keys(event.properties) : [],
    data_keys: event.data ? Object.keys(event.data) : []
  }, null, 2));

  if (objectiveName === 'product_interest_discovery') {
    await handleProductInterestDiscovery(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'contact_information_collection' || objectiveName === 'greeting_and_qualification') {
    await handleContactInfoCollection(supabase, conversationId, objectiveName, outputVariables, event);
  } else if (objectiveName === 'demo_video_showcase') {
    await handleVideoShowcaseObjective(supabase, conversationId, outputVariables, event);
  }

  return NextResponse.json({ received: true });
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
