import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { createClient } from '@/utils/supabase/server';
import { getErrorMessage, logError } from '@/lib/errors';

interface TavusConversation {
  conversation_id: string;
  conversation_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  duration?: number;
}

interface TavusConversationDetail {
  conversation_id: string;
  conversation_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  duration?: number;
  transcript?: any;
  perception_analysis?: any;
}

async function handleGET(req: NextRequest) {
  const supabase = createClient();

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    // Get demo ID from query params (optional - if not provided, sync all user's demos)
    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');

    // Fetch user's demos that have tavus_conversation_id
    let demosQuery = supabase
      .from('demos')
      .select('id, name, tavus_conversation_id, tavus_persona_id')
      .eq('user_id', user.id)
      .not('tavus_conversation_id', 'is', null);

    if (demoId) {
      demosQuery = demosQuery.eq('id', demoId);
    }

    const { data: demos, error: demosError } = await demosQuery;

    if (demosError) {
      throw demosError;
    }

    if (!demos || demos.length === 0) {
      return NextResponse.json({ 
        message: 'No demos with Domo conversations found',
        synced: 0 
      });
    }

    const results = [];

    // Process each demo's conversation
    for (const demo of demos) {
      try {
        const conversationId = demo.tavus_conversation_id;
        if (!conversationId) continue;

        // Check if we already have this conversation in our database
        const { data: existingConversation } = await supabase
          .from('conversation_details')
          .select('id, updated_at')
          .eq('tavus_conversation_id', conversationId)
          .single();

        // Fetch conversation details from Tavus API with verbose=true to get transcript and perception data
        const conversationResponse = await fetch(
          `https://tavusapi.com/v2/conversations/${conversationId}?verbose=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': tavusApiKey,
            },
          }
        );

        if (!conversationResponse.ok) {
          console.warn(`Failed to fetch conversation ${conversationId}:`, conversationResponse.status);
          continue;
        }

        const conversationData: TavusConversationDetail = await conversationResponse.json();
        
        // Log the FULL response to see what fields are actually available
        

        // Extract transcript and perception analysis from events array
        const events = (conversationData as any).events || [];
        
        // Find transcript in events - try multiple event types and locations
        let transcript = null;
        const transcriptEvent = events.find((event: any) => 
          event.event_type === 'application.transcription_ready' ||
          event.event_type?.includes('transcription')
        );
        
        if (transcriptEvent) {
          transcript = transcriptEvent.properties?.transcript || 
                      transcriptEvent.data?.transcript || 
                      transcriptEvent.transcript || null;
        }
        
        // Also check if transcript is at the conversation level
        if (!transcript && (conversationData as any).transcript) {
          transcript = (conversationData as any).transcript;
        }
        
        // Find perception analysis in events - try multiple event types and locations
        let perceptionAnalysis = null;
        const perceptionEvent = events.find((event: any) => 
          event.event_type === 'application.perception_analysis' ||
          event.event_type?.includes('perception')
        );
        
        if (perceptionEvent) {
          perceptionAnalysis = perceptionEvent.properties?.analysis || 
                              perceptionEvent.data?.analysis || 
                              perceptionEvent.analysis || null;
        }
        
        // Also check if perception analysis is at the conversation level
        if (!perceptionAnalysis && (conversationData as any).perception_analysis) {
          perceptionAnalysis = (conversationData as any).perception_analysis;
        }
        
        
        
        if (transcript) {
        }
        
        if (perceptionAnalysis) {
        }

        // If no perception analysis, check persona configuration
        if (!perceptionAnalysis && demo.tavus_persona_id) {
          try {
            const personaResponse = await fetch(
              `https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': tavusApiKey,
                },
              }
            );

            if (personaResponse.ok) {
              const personaData = await personaResponse.json();
              const perceptionModel = personaData.perception_model;
              
              if (perceptionModel !== 'raven-0') {
                console.warn(`⚠️ Perception analysis requires perception_model to be set to 'raven-0'. Current: ${perceptionModel || 'not set'}`);
              }
            }
          } catch (personaError) {
            console.warn('Could not check persona configuration:', personaError);
          }
        }

        // Calculate duration from created_at and updated_at if not provided by Tavus
        // Tavus API doesn't return duration/completed_at, so we calculate from timestamps
        let durationSeconds = conversationData.duration || null;
        let completedAt = conversationData.completed_at || null;

        if (!durationSeconds && conversationData.created_at && conversationData.updated_at) {
          const startTime = new Date(conversationData.created_at).getTime();
          const endTime = new Date(conversationData.updated_at).getTime();
          if (endTime > startTime) {
            durationSeconds = Math.round((endTime - startTime) / 1000);
          }
        }

        // Use updated_at as completed_at for ended conversations if not provided
        if (!completedAt && conversationData.status === 'ended' && conversationData.updated_at) {
          completedAt = conversationData.updated_at;
        }

        // Prepare conversation detail record with transcript and perception data
        const conversationDetail = {
          demo_id: demo.id,
          tavus_conversation_id: conversationId,
          conversation_name: conversationData.conversation_name || `Conversation ${conversationId.slice(-8)}`,
          transcript: transcript,
          perception_analysis: perceptionAnalysis,
          started_at: conversationData.created_at ? new Date(conversationData.created_at).toISOString() : null,
          completed_at: completedAt ? new Date(completedAt).toISOString() : null,
          duration_seconds: durationSeconds,
          status: conversationData.status || 'active',
        };

        // Insert or update the conversation detail
        if (existingConversation) {
          const { error: updateError } = await supabase
            .from('conversation_details')
            .update(conversationDetail)
            .eq('id', existingConversation.id);

          if (updateError) {
            throw updateError;
          }

          results.push({
            demo_id: demo.id,
            demo_name: demo.name,
            conversation_id: conversationId,
            action: 'updated',
            has_transcript: !!transcript,
            has_perception: !!perceptionAnalysis
          });
        } else {
          const { error: insertError } = await supabase
            .from('conversation_details')
            .insert([conversationDetail]);

          if (insertError) {
            throw insertError;
          }

          results.push({
            demo_id: demo.id,
            demo_name: demo.name,
            conversation_id: conversationId,
            action: 'created',
            has_transcript: !!transcript,
            has_perception: !!perceptionAnalysis
          });
        }

              } catch (error) {
          console.error(`💥 Failed to sync conversation for demo ${demo.id}:`, error);
          logError(error, `Failed to sync conversation for demo ${demo.id}`);
          results.push({
            demo_id: demo.id,
            demo_name: demo.name,
            conversation_id: demo.tavus_conversation_id,
            action: 'failed',
            error: getErrorMessage(error, 'Unknown error')
          });
        }
    }

    return NextResponse.json({
      message: 'Conversation sync completed',
      synced: results.length,
      results
    });

  } catch (error: unknown) {
    logError(error, 'Tavus conversation sync failed');
    const message = getErrorMessage(error, 'An unexpected error occurred');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, conversationId } = await req.json();

    if (!demoId && !conversationId) {
      return NextResponse.json({ 
        error: 'Either demoId or conversationId is required' 
      }, { status: 400 });
    }

    // If conversationId is provided directly, find the associated demo
    let targetDemo = null;
    if (conversationId && !demoId) {
      const { data: demo } = await supabase
        .from('demos')
        .select('id, name, tavus_conversation_id')
        .eq('user_id', user.id)
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (!demo) {
        return NextResponse.json({ 
          error: 'Conversation not found or not owned by user' 
        }, { status: 404 });
      }
      targetDemo = demo;
    } else if (demoId) {
      const { data: demo } = await supabase
        .from('demos')
        .select('id, name, tavus_conversation_id')
        .eq('user_id', user.id)
        .eq('id', demoId)
        .single();

      if (!demo) {
        return NextResponse.json({ 
          error: 'Demo not found or not owned by user' 
        }, { status: 404 });
      }
      targetDemo = demo;
    }

    if (!targetDemo?.tavus_conversation_id) {
      return NextResponse.json({ 
        error: 'Demo does not have an associated Tavus conversation' 
      }, { status: 400 });
    }

    // Create a GET request to sync this specific conversation
    const getUrl = new URL(req.url);
    getUrl.searchParams.set('demoId', targetDemo.id);
    
    const getRequest = new NextRequest(getUrl.toString(), {
      method: 'GET',
      headers: req.headers,
    });

    return await handleGET(getRequest);

  } catch (error: unknown) {
    logError(error, 'Tavus conversation sync POST failed');
    const message = getErrorMessage(error, 'An unexpected error occurred');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/sync-tavus-conversations',
});
export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/sync-tavus-conversations',
});
