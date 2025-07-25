import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
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
        // We can add more conversation settings here later
      }),
    });

    if (!conversationResponse.ok) {
      const errorBody = await conversationResponse.text();
      console.error('Tavus Conversation API Error:', errorBody);
      return NextResponse.json({ error: `Failed to start Tavus conversation: ${conversationResponse.statusText}` }, { status: conversationResponse.status });
    }

    const conversationData = await conversationResponse.json();

    // Save the conversation ID to the demo
    const { error: updateError } = await supabase
      .from('demos')
      .update({ tavus_conversation_id: conversationData.conversation_id })
      .eq('id', demoId);

    if (updateError) {
      console.error('Supabase update error after starting conversation:', updateError);
      // We will proceed but this is a critical error to flag for debugging
    }

    return NextResponse.json(conversationData);

  } catch (error: any) {
    console.error('Start Conversation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
