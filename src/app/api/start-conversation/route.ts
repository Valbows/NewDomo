import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

// Validate that a URL points to a Daily room
const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

// Extract conversation ID from a Daily/Tavus URL
function extractConversationIdFromUrl(url: string): string | null {
  const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Check if a Tavus conversation is still active (not ended)
// This is more reliable than just checking if the Daily room exists
async function isTavusConversationActive(conversationId: string, apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!resp.ok) {
      // 404 means conversation doesn't exist or was deleted
      if (resp.status === 404) {
        console.log(`Tavus conversation ${conversationId} not found (404)`);
        return false;
      }
      console.warn(`Tavus API returned ${resp.status} when checking conversation ${conversationId}`);
      return false;
    }

    const data = await resp.json();
    const status = data.status;

    // Active statuses that mean we can still join
    const activeStatuses = ['active', 'starting', 'waiting'];
    const isActive = activeStatuses.includes(status);

    console.log(`Tavus conversation ${conversationId} status: ${status} (active: ${isActive})`);
    return isActive;
  } catch (e) {
    console.warn(`Error checking Tavus conversation ${conversationId}:`, e);
    return false;
  }
}

// Simple in-memory lock to dedupe concurrent starts per demo within a single server instance
const startLocks = new Map<string, Promise<unknown>>();

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, forceNew = false } = await req.json();

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Verify user owns the demo and get the persona ID
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('user_id, tavus_persona_id, tavus_conversation_id, metadata')
      .eq('id', demoId)
      .single();

    if (demoError || !demo || demo.user_id !== user.id) {
      return NextResponse.json({ error: 'Demo not found or you do not have permission.' }, { status: 404 });
    }

    if (!demo.tavus_persona_id) {
      return NextResponse.json({ error: 'This demo does not have a configured agent persona.' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key is not configured.' }, { status: 500 });
    }

    // Reuse existing active conversation if a valid Daily room URL is already saved AND conversation is still active
    if (!forceNew) {
      try {
        const md = typeof (demo as any).metadata === 'string' ? JSON.parse((demo as any).metadata as string) : (demo as any).metadata;
        const existingUrl = md?.tavusShareableLink as string | undefined;
        const existingConvId = (demo as any).tavus_conversation_id as string | undefined;

        if (existingUrl && isDailyRoomUrl(existingUrl) && existingConvId) {
          // Check if the Tavus conversation is still active (not just if room exists)
          if (await isTavusConversationActive(existingConvId, tavusApiKey)) {
            console.log('Reusing existing active Tavus conversation:', existingConvId);
            return NextResponse.json({
              conversation_id: existingConvId,
              conversation_url: existingUrl,
            });
          } else {
            console.warn('Existing Tavus conversation is ended or invalid. Creating a new conversation:', existingConvId);
            // Clear stale data from database
            try {
              const { tavusShareableLink, ...restMetadata } = md || {};
              await supabase
                .from('demos')
                .update({
                  tavus_conversation_id: null,
                  metadata: restMetadata
                })
                .eq('id', demoId);
              console.log('Cleared stale conversation data from demo');
            } catch (clearError) {
              console.warn('Failed to clear stale conversation data:', clearError);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse demo metadata while checking for existing conversation URL:', e);
      }
    } else {
      console.log('forceNew=true: will create a new conversation even if an existing URL is present.');
    }

    // If another request is already starting a conversation for this demo, wait and then reuse the result
    if (!forceNew && startLocks.has(demoId)) {
      console.log('Conversation start already in progress for demo', demoId, '— waiting');
      try {
        await startLocks.get(demoId);
      } catch (_) {
        // ignore; we'll proceed to try again
      }
      const { data: afterDemo } = await supabase
        .from('demos')
        .select('tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();
      try {
        const md2 = typeof afterDemo?.metadata === 'string' ? JSON.parse(afterDemo?.metadata as any) : (afterDemo as any)?.metadata;
        const url2 = md2?.tavusShareableLink as string | undefined;
        if (url2 && isDailyRoomUrl(url2)) {
          return NextResponse.json({
            conversation_id: afterDemo?.tavus_conversation_id || null,
            conversation_url: url2,
          });
        }
      } catch {}
      // If not found, fall through to attempt creation
    }

    // Determine replica_id: prefer env override, else fetch persona default
    let finalReplicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
    if (!finalReplicaId) {
      try {
        const personaResp = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}` , {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tavusApiKey,
          },
        });
        if (personaResp.ok) {
          const persona = await personaResp.json();
          finalReplicaId = (persona?.default_replica_id || '').trim();
          if (finalReplicaId) {
            console.log('Using persona default_replica_id for conversation:', finalReplicaId);
          } else {
            console.warn('Persona has no default_replica_id; a replica_id must be provided via TAVUS_REPLICA_ID.');
          }
        } else {
          const t = await personaResp.text();
          console.warn('Failed to fetch persona for default_replica_id; status:', personaResp.status, t);
        }
      } catch (e) {
        console.warn('Error fetching persona default_replica_id:', e);
      }
    } else {
      console.log('Using replica_id from env for conversation:', finalReplicaId);
    }

    // Per Tavus docs, conversations accept callback_url for webhooks
    // If Tavus doesn't send HMAC signatures, we include a fallback URL token (?t=...) for auth.
    const baseUrlForWebhook = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    const callbackUrl = `${baseUrlForWebhook}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

    // Note: We don't override objectives here because:
    // 1. If persona was created with custom objectives, those are already baked in
    // 2. If persona uses default objectives, those are also baked in
    // 3. Tavus personas have their objectives set at creation time
    console.log('\n🎭 CONVERSATION PERSONA SELECTION');
    console.log('='.repeat(40));
    console.log(`Demo ID: ${demoId}`);
    console.log(`Persona ID from DB: ${demo.tavus_persona_id}`);
    console.log(`Using persona with its configured objectives (no override)`);
    console.log('='.repeat(40));

    const conversationPayload: any = {
      persona_id: demo.tavus_persona_id,
      callback_url: callbackUrl,
      ...(finalReplicaId ? { replica_id: finalReplicaId } : {}),
      // Note: No objectives_id override - persona already has the correct objectives
    };
    if (!conversationPayload.replica_id) {
      const msg = 'Missing replica_id: Set TAVUS_REPLICA_ID or assign a default replica to the persona.';
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          error: msg,
          hint: 'See Tavus docs: Create Conversation requires persona_id and replica_id unless persona has a default replica.',
          payload: { persona_id: conversationPayload.persona_id },
        }, { status: 400 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Define the creation flow so we can run it under the lock
    const doStart = async (): Promise<NextResponse | any> => {
      const conversationResponse = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
        body: JSON.stringify(conversationPayload),
      });

      if (!conversationResponse.ok) {
        const contentType = conversationResponse.headers.get('content-type') || '';
        let errorBody: any;
        try {
          errorBody = contentType.includes('application/json')
            ? await conversationResponse.json()
            : await conversationResponse.text();
        } catch (_) {
          try {
            errorBody = await conversationResponse.text();
          } catch {
            errorBody = 'Unable to parse error body';
          }
        }
        logError(errorBody, 'Tavus Conversation API Error');

        const base = {
          error: `Failed to start Tavus conversation: ${conversationResponse.status} ${conversationResponse.statusText}`,
        } as any;

        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json(
            {
              ...base,
              tavusError: errorBody,
              payload: {
                persona_id: conversationPayload.persona_id,
                replica_id: conversationPayload.replica_id,
              },
            },
            { status: conversationResponse.status }
          );
        }
        return NextResponse.json(base, { status: conversationResponse.status });
      }

      const conversationData = await conversationResponse.json();
      
      console.log('Conversation data received:', conversationData);

      // Get current demo metadata
      const { data: currentDemo, error: fetchError } = await supabase
        .from('demos')
        .select('metadata')
        .eq('id', demoId)
        .single();

      if (fetchError) {
        logError(fetchError, 'Error fetching current demo');
      }

      // Save the conversation ID and shareable link to the demo
      const updatedMetadata = {
        ...(typeof currentDemo?.metadata === 'string' ? (() => { try { return JSON.parse(currentDemo?.metadata as any) } catch { return {} } })() : currentDemo?.metadata),
        tavusShareableLink: conversationData.conversation_url
      };

      const { error: updateError } = await supabase
        .from('demos')
        .update({ 
          tavus_conversation_id: conversationData.conversation_id,
          metadata: updatedMetadata
        })
        .eq('id', demoId);

      if (updateError) {
        logError(updateError, 'Supabase update error after starting conversation');
        // We will proceed but this is a critical error to flag for debugging
      }

      return conversationData;
    };

    // Execute under in-memory lock
    let result: any;
    if (startLocks.has(demoId)) {
      console.log('Conversation start already in progress for demo', demoId, '— waiting');
      try {
        await startLocks.get(demoId);
      } catch (_) {}
      // After wait, reuse if available
      const { data: afterDemo2 } = await supabase
        .from('demos')
        .select('tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();
      try {
        const md3 = typeof afterDemo2?.metadata === 'string' ? JSON.parse(afterDemo2?.metadata as any) : (afterDemo2 as any)?.metadata;
        const url3 = md3?.tavusShareableLink as string | undefined;
        if (url3 && isDailyRoomUrl(url3)) {
          return NextResponse.json({
            conversation_id: afterDemo2?.tavus_conversation_id || null,
            conversation_url: url3,
          });
        }
      } catch {}
      // Fall-through: we'll try to start anew
    }

    const p = doStart();
    startLocks.set(demoId, p);
    try {
      result = await p;
    } finally {
      startLocks.delete(demoId);
    }

    if (result instanceof NextResponse) {
      return result;
    }
    return NextResponse.json(result);

  } catch (error: unknown) {
    logError(error, 'Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/start-conversation',
});
