import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const body = await req.json();
    console.log('Test webhook received:', JSON.stringify(body, null, 2));

    // Simulate a video tool call
    const testEvent = {
      event_type: 'conversation_utterance',
      conversation_id: 'test-conversation-id',
      utterance: 'fetch_video("Demo Overview")'
    };

    // Test the webhook logic
    const webhookResponse = await fetch('http://localhost:3000/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const webhookResult = await webhookResponse.text();
    console.log('Webhook response:', webhookResult);

    return NextResponse.json({ 
      message: 'Test webhook completed',
      webhookResponse: webhookResult 
    });

  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
