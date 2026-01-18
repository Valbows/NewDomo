/**
 * Cleanup Stale Conversations API
 *
 * This endpoint finds conversations marked as "active" or "starting" in the database
 * but have actually ended in Tavus, and updates their status accordingly.
 * This helps fix rate limit issues caused by phantom active conversations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();
  const serviceSupabase = createServiceClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    // Get all demos owned by this user
    const { data: userDemos, error: demosError } = await supabase
      .from('demos')
      .select('id')
      .eq('user_id', user.id);

    if (demosError || !userDemos || userDemos.length === 0) {
      return NextResponse.json({
        message: 'No demos found',
        cleaned: 0
      });
    }

    const demoIds = userDemos.map(d => d.id);

    // Find all conversations in "active" or "starting" status
    const { data: activeConversations, error: convError } = await serviceSupabase
      .from('conversation_details')
      .select('id, tavus_conversation_id, demo_id, status, started_at')
      .in('demo_id', demoIds)
      .in('status', ['active', 'starting', 'waiting']);

    if (convError) {
      throw convError;
    }

    if (!activeConversations || activeConversations.length === 0) {
      return NextResponse.json({
        message: 'No active conversations to cleanup',
        cleaned: 0
      });
    }

    const results: Array<{
      conversationId: string;
      previousStatus: string;
      newStatus: string;
      action: string;
    }> = [];

    // Check each conversation's actual status in Tavus
    for (const conv of activeConversations) {
      if (!conv.tavus_conversation_id) continue;

      try {
        const response = await fetch(
          `https://tavusapi.com/v2/conversations/${conv.tavus_conversation_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': tavusApiKey,
            },
          }
        );

        if (response.status === 404) {
          // Conversation doesn't exist in Tavus anymore - mark as ended
          await serviceSupabase
            .from('conversation_details')
            .update({
              status: 'ended',
              completed_at: new Date().toISOString(),
            })
            .eq('id', conv.id);

          results.push({
            conversationId: conv.tavus_conversation_id,
            previousStatus: conv.status,
            newStatus: 'ended',
            action: 'not_found_in_tavus',
          });
          continue;
        }

        if (!response.ok) {
          // API error - skip this one
          continue;
        }

        const tavusData = await response.json();
        const tavusStatus = tavusData.status;

        // If Tavus says it's ended but our DB says active, update
        if (['ended', 'completed', 'failed'].includes(tavusStatus) &&
            ['active', 'starting', 'waiting'].includes(conv.status)) {

          // Calculate duration
          let durationSeconds = null;
          if (conv.started_at) {
            const startTime = new Date(conv.started_at).getTime();
            const endTime = Date.now();
            durationSeconds = Math.round((endTime - startTime) / 1000);
          }

          await serviceSupabase
            .from('conversation_details')
            .update({
              status: tavusStatus === 'failed' ? 'failed' : 'ended',
              completed_at: new Date().toISOString(),
              duration_seconds: durationSeconds,
            })
            .eq('id', conv.id);

          results.push({
            conversationId: conv.tavus_conversation_id,
            previousStatus: conv.status,
            newStatus: tavusStatus === 'failed' ? 'failed' : 'ended',
            action: 'synced_with_tavus',
          });
        }
      } catch (error) {
        console.warn(`Failed to check conversation ${conv.tavus_conversation_id}:`, error);
      }
    }

    // Also clear stale tavus_conversation_id from demos table
    for (const demoId of demoIds) {
      const { data: demo } = await supabase
        .from('demos')
        .select('tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();

      if (demo?.tavus_conversation_id) {
        // Check if this conversation is still active in Tavus
        try {
          const response = await fetch(
            `https://tavusapi.com/v2/conversations/${demo.tavus_conversation_id}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': tavusApiKey,
              },
            }
          );

          const shouldClear = response.status === 404 ||
            (response.ok && ['ended', 'completed', 'failed'].includes((await response.json()).status));

          if (shouldClear) {
            const currentMetadata = typeof demo.metadata === 'string'
              ? JSON.parse(demo.metadata)
              : (demo.metadata || {});

            const { tavusShareableLink, ...restMetadata } = currentMetadata;

            await supabase
              .from('demos')
              .update({
                tavus_conversation_id: null,
                metadata: restMetadata,
              })
              .eq('id', demoId);
          }
        } catch (error) {
          // Ignore errors for demo cleanup
        }
      }
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      activeFound: activeConversations.length,
      cleaned: results.length,
      results,
    });

  } catch (error: unknown) {
    logError(error, 'Cleanup stale conversations failed');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/cleanup-stale-conversations',
});
