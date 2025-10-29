import { NextRequest, NextResponse } from 'next/server';

async function handleGET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || 'cd9c38355945c4ec';
    
    // Create a mock conversation completion event with transcript and perception data
    const mockEvent = {
      event_type: 'application.conversation.completed',
      conversation_id: conversationId,
      data: {
        perception: {
          overall_score: 0.85,
          engagement_score: 0.92,
          sentiment_score: 0.78,
          comprehension_score: 0.88,
          interest_level: 'high',
          key_insights: [
            'User showed high engagement with product features',
            'Questions focused on pricing and implementation',
            'Positive sentiment throughout conversation',
            'Strong comprehension of technical concepts'
          ]
        },
        transcript: [
          {
            timestamp: 1725504781,
            speaker: 'AI Agent',
            text: 'Hello! Welcome to our product demo. How can I help you today?'
          },
          {
            timestamp: 1725504785,
            speaker: 'User',
            text: 'Hi, I\'d like to learn more about your pricing plans.'
          },
          {
            timestamp: 1725504790,
            speaker: 'AI Agent', 
            text: 'Great question! Let me show you our different pricing tiers and what each includes.'
          },
          {
            timestamp: 1725504820,
            speaker: 'User',
            text: 'That looks good. How quickly can we get started with implementation?'
          },
          {
            timestamp: 1725504825,
            speaker: 'AI Agent',
            text: 'We can typically get you set up within 2-3 business days. Would you like me to connect you with our implementation team?'
          }
        ],
        summary: {
          duration_seconds: 180,
          total_messages: 12,
          user_satisfaction: 'high',
          next_steps: 'Connect with implementation team'
        }
      },
      created_at: new Date().toISOString()
    };

    // Send this event to your webhook handler
    const webhookUrl = `${url.origin}/api/tavus-webhook?t=${process.env.TAVUS_WEBHOOK_TOKEN || 'your_webhook_token'}`;
    
    console.log(`🧪 Sending test completion event to webhook: ${webhookUrl}`);
    console.log(`📊 Mock event data:`, JSON.stringify(mockEvent, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Don't include signature for now to test basic functionality
      },
      body: JSON.stringify(mockEvent)
    });
    
    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test conversation completion event sent',
      conversationId,
      webhookUrl,
      webhookResponse: {
        status: response.status,
        ok: response.ok,
        data: responseJson
      },
      mockEvent
    });

  } catch (error) {
    console.error('Test completion error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;