import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId } = await req.json();

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Verify user owns the demo and get the persona ID
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('user_id, tavus_persona_id')
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

    // TODO: Select a replica. For now, we can use a stock replica from Tavus if available, or implement replica creation/selection.
    // Using a placeholder stock replica for now.
        const replicaId = 'rca8a38779a8'; // Using the valid replica ID provided by the user.

    const conversationResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify({
        replica_id: replicaId, 
        persona_id: demo.tavus_persona_id,
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tavus-webhook`,
        // We can add more conversation settings here later
      }),
    });

    if (!conversationResponse.ok) {
      const errorBody = await conversationResponse.text();
      logError(errorBody, 'Tavus Conversation API Error');
      return NextResponse.json({ error: `Failed to start Tavus conversation: ${conversationResponse.statusText}` }, { status: conversationResponse.status });
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
      ...currentDemo?.metadata,
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

    return NextResponse.json(conversationData);

  } catch (error: unknown) {
    logError(error, 'Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/start-conversation',
});
