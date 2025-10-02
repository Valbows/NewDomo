import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage, logError } from '@/lib/errors';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';
import { verifyHmacSha256Signature } from '@/lib/security/webhooks';
import { shouldIngestEvent, ingestAnalyticsForEvent } from '@/lib/tavus/webhook_ingest';
import crypto from 'crypto';

// Store detailed conversation data (transcript, perception) in conversation_details table
async function storeDetailedConversationData(supabase: any, conversationId: string, event: any) {
  if (!conversationId) return;

  try {
    // Find the demo associated with this conversation
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoError || !demo) {
      console.warn(`No demo found for conversation ${conversationId}`);
      return;
    }

    // Extract transcript and perception data from the webhook event
    // Handle both direct event data and events array format
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
    const events = event?.events || event?.data?.events || [];
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
      return;
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
      console.error('Failed to store detailed conversation data:', upsertError);
    } else {
      console.log('✅ Successfully stored detailed conversation data');
    }

  } catch (error) {
    console.error('Error storing detailed conversation data:', error);
  }
}

// Testable handler for Tavus webhook; used by tests directly and by the route wrapper.
export async function handlePOST(req: NextRequest) {
  // Create Supabase client with service role for webhook authentication
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    // Verify webhook authenticity using either:
    // 1) HMAC-SHA256 signature header (preferred), or
    // 2) A fallback URL token appended as ?t=<token> to the callback_url when creating conversations.
    const secret = process.env.TAVUS_WEBHOOK_SECRET;
    const signature =
      req.headers.get('x-tavus-signature') ||
      req.headers.get('tavus-signature') ||
      req.headers.get('x-signature');
    // Support both NextRequest (with nextUrl) and standard Request in tests
    const urlObj = (req as any)?.nextUrl ?? new URL((req as any)?.url);
    const tokenParam = urlObj.searchParams.get('t') || urlObj.searchParams.get('token');
    const tokenEnv = process.env.TAVUS_WEBHOOK_TOKEN;

    const rawBody = await req.text();
    const hmacOk = !!secret && verifyHmacSha256Signature(rawBody, signature, secret);
    const tokenOk = !!tokenEnv && !!tokenParam && tokenParam === tokenEnv;
    if (!hmacOk && !tokenOk) {
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
      try {
        const eventIdCandidate =
          event?.id || event?.event_id || event?.data?.id || event?.data?.event_id;
        const eventId = String(
          eventIdCandidate || crypto.createHash('sha256').update(rawBody).digest('hex')
        );

        const { data: existing } = await supabase
          .from('processed_webhook_events')
          .select('event_id')
          .eq('event_id', eventId)
          .single();

        if (existing?.event_id) {
          console.log('Idempotency: duplicate tool-call event detected, skipping processing:', eventId);
          return NextResponse.json({ received: true });
        }

        await supabase
          .from('processed_webhook_events')
          .insert({ event_id: eventId });
      } catch (idemErr) {
        // Do not fail the webhook if idempotency table is missing or other non-critical errors occur
        console.warn('Idempotency check/insert failed (non-fatal):', idemErr);
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
          try {
            const { data: demoForBroadcast } = await supabase
              .from('demos')
              .select('id')
              .eq('tavus_conversation_id', conversation_id)
              .single();

            if (demoForBroadcast?.id) {
              const channelName = `demo-${demoForBroadcast.id}`;
              const channel = supabase.channel(channelName);
              // Ensure the realtime channel is subscribed before sending
              await new Promise<void>((resolve, reject) => {
                let settled = false;
                channel.subscribe((status) => {
                  if (status === 'SUBSCRIBED' && !settled) {
                    settled = true;
                    console.log(`Server Realtime: SUBSCRIBED to ${channelName}`);
                    resolve();
                  }
                });
                setTimeout(() => {
                  if (!settled) {
                    settled = true;
                    reject(new Error('Server Realtime subscribe timeout'));
                  }
                }, 2000);
              });

              await channel.send({
                type: 'broadcast',
                event: 'analytics_updated',
                payload: {
                  conversation_id,
                  event_type: event?.event_type || event?.type || null,
                },
              });
              console.log(`Broadcasted analytics_updated for demo ${demoForBroadcast.id}`);

              // Clean up channel
              await supabase.removeChannel(channel);
            }
          } catch (broadcastErr) {
            console.warn('Webhook: analytics_updated broadcast failed (non-fatal):', broadcastErr);
          }

          return NextResponse.json({ received: true });
        } catch (ingestErr) {
          logError(ingestErr, 'Webhook Ingest Error');
          return NextResponse.json({ received: true });
        }
      }
      // If it is an objective completion, continue to the objective processing below
    }

    // Handle objective completion events
    console.log(`🔍 Checking event type: "${event.event_type}"`);
    console.log(`🔍 Event type matches objective completion:`, 
      event.event_type === 'application.objective_completed' || 
      event.event_type === 'objective_completed' || 
      event.event_type === 'conversation.objective.completed'
    );
    
    if (event.event_type === 'application.objective_completed' || event.event_type === 'objective_completed' || event.event_type === 'conversation.objective.completed') {
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
        try {
          // Store product interest data
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
              conversation_id: conversation_id,
              objective_name: objectiveName,
              primary_interest: outputVariables.primary_interest || null,
              pain_points: painPointsArray,
              event_type: event.event_type,
              raw_payload: event,
              received_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Failed to store product interest data:', insertError);
          } else {
            console.log('✅ Successfully stored product interest data');
          }
        } catch (error) {
          console.error('Error processing product interest discovery:', error);
        }
      } else if (objectiveName === 'contact_information_collection' || objectiveName === 'greeting_and_qualification') {
        // Handle contact info objective (support both old and new objective names)
        console.log('🔍 Processing qualification data insertion...');
        console.log('📊 Data to insert:', {
          conversation_id,
          first_name: outputVariables.first_name,
          last_name: outputVariables.last_name,
          email: outputVariables.email,
          position: outputVariables.position,
          objective_name: objectiveName
        });
        
        try {
          const { error: insertError } = await supabase
            .from('qualification_data')
            .insert({
              conversation_id: conversation_id,
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
            console.error('❌ Failed to store qualification data:', insertError);
          } else {
            console.log('✅ Successfully stored qualification data');
          }
        } catch (error) {
          console.error('❌ Error processing contact information collection:', error);
        }
      }
      
      return NextResponse.json({ received: true });
    }

    // Process tool calls
    if (toolName === 'fetch_video' || toolName === 'play_video') {
      const video_title = toolArgs?.video_title || toolArgs?.title;
      if (!video_title || typeof video_title !== 'string' || !video_title.trim()) {
        logError('Webhook: Missing or invalid video title for fetch_video/play_video', 'ToolCall Validation');
        
        // Alert: Guardrail violation detected
        console.warn('🚨 GUARDRAIL VIOLATION: Invalid video title in tool call', {
          conversation_id,
          toolName,
          toolArgs,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ message: 'Invalid or missing video title.' });
      }
      console.log('Extracted video title:', video_title);

      console.log(`Processing video request for: ${video_title}`);

      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        logError(`Webhook Error: Could not find demo for conversation_id: ${conversation_id}`);
        logError(demoError, 'Demo error details');
        // Return 200 to prevent Tavus from retrying, as this is a permanent error.
        return NextResponse.json({ message: 'Demo not found for conversation.' });
      }
      
      console.log(`Found demo: ${demo.id}`);

      // 2. Find the video in that demo
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demo.id)
        .eq('title', video_title)
        .single();

      if (videoError || !video) {
        logError(`Webhook Error: Could not find video with title '${video_title}' in demo ${demo.id}`);
        logError(videoError, 'Video error details');
        
        // Let's also check what videos are available
        const { data: availableVideos } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demo.id);
        console.log('Available videos in demo:', availableVideos?.map(v => v.title));
        
        return NextResponse.json({ message: 'Video not found.' });
      }

      console.log(`Found video storage path: ${video.storage_url}`);

      // 3. Generate a signed URL for the video
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        logError(signedUrlError, 'Error creating signed URL');
        return NextResponse.json({ message: 'Could not generate video URL.' });
      }

      console.log(`Generated signed URL: ${signedUrlData.signedUrl}`);

      // 4. Broadcast the signed video URL to the frontend via Supabase Realtime
      {
        const channelName = `demo-${demo.id}`;
        const channel = supabase.channel(channelName);
        try {
          await new Promise<void>((resolve, reject) => {
            let settled = false;
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED' && !settled) {
                settled = true;
                console.log(`Server Realtime: SUBSCRIBED to ${channelName}`);
                resolve();
              }
            });
            setTimeout(() => {
              if (!settled) {
                settled = true;
                reject(new Error('Server Realtime subscribe timeout'));
              }
            }, 2000);
          });
        } catch (subErr) {
          console.warn('Webhook: play_video subscribe failed (non-fatal):', subErr);
        }

        try {
          await channel.send({
            type: 'broadcast',
            event: 'play_video',
            payload: { url: signedUrlData.signedUrl },
          });
          console.log(`Broadcasted play_video event for demo ${demo.id}`);
        } catch (sendErr) {
          console.warn('Webhook: play_video broadcast failed (non-fatal):', sendErr);
        } finally {
          try {
            await supabase.removeChannel(channel);
          } catch {}
        }
      }
    } else if (toolName === 'show_trial_cta') {
      console.log('Processing show_trial_cta tool call');
      
      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id, cta_title, cta_message, cta_button_text, cta_button_url')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        logError(`Webhook Error: Could not find demo for conversation_id: ${conversation_id}`);
        return NextResponse.json({ message: 'Demo not found for conversation.' });
      }

      // 2. Broadcast the CTA event to the frontend
      {
        const channelName = `demo-${demo.id}`;
        const channel = supabase.channel(channelName);
        try {
          await new Promise<void>((resolve, reject) => {
            let settled = false;
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED' && !settled) {
                settled = true;
                console.log(`Server Realtime: SUBSCRIBED to ${channelName}`);
                resolve();
              }
            });
            setTimeout(() => {
              if (!settled) {
                settled = true;
                reject(new Error('Server Realtime subscribe timeout'));
              }
            }, 2000);
          });
        } catch (subErr) {
          console.warn('Webhook: show_trial_cta subscribe failed (non-fatal):', subErr);
        }

        try {
          await channel.send({
            type: 'broadcast',
            event: 'show_trial_cta',
            payload: {
              cta_title: (demo as any).cta_title ?? null,
              cta_message: (demo as any).cta_message ?? null,
              cta_button_text: (demo as any).cta_button_text ?? null,
              cta_button_url: (demo as any).cta_button_url ?? null,
            },
          });
          console.log(`Broadcasted show_trial_cta event for demo ${demo.id}`);
        } catch (sendErr) {
          console.warn('Webhook: show_trial_cta broadcast failed (non-fatal):', sendErr);
        } finally {
          try {
            await supabase.removeChannel(channel);
          } catch {}
        }
      }
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    logError(error, 'Tavus Webhook Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
