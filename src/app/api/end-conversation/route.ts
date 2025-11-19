import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON and sendBeacon (text) requests
    let conversationId: string;
    let demoId: string;
    
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      conversationId = body.conversationId;
      demoId = body.demoId;
    } else {
      // Handle sendBeacon request (sent as text)
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        conversationId = body.conversationId;
        demoId = body.demoId;
      } catch {
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
      }
    }

    // We need either conversationId or demoId to proceed
    if (!conversationId && !demoId) {
      return NextResponse.json({ error: 'Missing conversationId or demoId' }, { status: 400 });
    }

    // Verify user owns the demo if demoId is provided
    if (demoId) {
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('user_id, tavus_conversation_id')
        .eq('id', demoId)
        .single();

      if (demoError || !demo || demo.user_id !== user.id) {
        return NextResponse.json({ error: 'Demo not found or you do not have permission.' }, { status: 404 });
      }

      // Handle conversation ID resolution
      if (!conversationId && demo.tavus_conversation_id) {
        // No conversation ID provided, use the stored one
        conversationId = demo.tavus_conversation_id;
      } else if (demo.tavus_conversation_id !== conversationId) {
        // IDs don't match, prefer the stored one if it exists
        if (demo.tavus_conversation_id) {
          conversationId = demo.tavus_conversation_id;
        } else {
        }
      }
    } else if (!conversationId) {
      // No demoId provided and no conversationId
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    // Final validation - ensure we have a conversation ID
    if (!conversationId || conversationId.trim() === '') {
      return NextResponse.json({ error: 'No valid conversation ID found' }, { status: 400 });
    }

    // Additional validation - check if conversation ID looks valid
    if (conversationId === 'null' || conversationId === 'undefined') {
      return NextResponse.json({ error: 'Invalid conversation ID (null/undefined)' }, { status: 400 });
    }


    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }


    // Try to end the conversation via Tavus API with robust error handling
    try {
      const getResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'x-api-key': tavusApiKey,
        },
      });
      

      if (!getResponse.ok) {
        if (getResponse.status === 404) {
          return NextResponse.json({ 
            success: true, 
            message: 'Conversation not found (might already be ended)',
            conversationId 
          });
        }
      } else {
        const conversationData = await getResponse.json();
        
        // If conversation is already ended, return success
        if (conversationData.status === 'ended' || conversationData.status === 'completed') {
          return NextResponse.json({ 
            success: true, 
            message: 'Conversation already ended',
            status: conversationData.status 
          });
        }
      }

      // End the conversation via Tavus API
      const endResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      });
      

      if (!endResponse.ok) {
        const errorText = await endResponse.text();
        
        // If it's a 404 or 409 (conflict), the conversation might already be ended
        if (endResponse.status === 404 || endResponse.status === 409) {
          return NextResponse.json({ 
            success: true, 
            message: 'Conversation already ended or not found',
            conversationId
          });
        }
        
        logError(`Tavus end conversation error: ${endResponse.status} - ${errorText}`, 'Failed to end conversation');
        return NextResponse.json({ 
          error: 'Failed to end conversation',
          details: process.env.NODE_ENV !== 'production' ? errorText : undefined
        }, { status: endResponse.status });
      }

      const endResult = await endResponse.json();
      

      return NextResponse.json({ 
        success: true, 
        message: 'Conversation ended successfully',
        conversationId,
        result: endResult
      });

    } catch (tavusError) {
      logError(tavusError, 'Tavus API call failed during conversation end');
      
      // Even if Tavus API fails, we'll return success since the conversation might have ended
      // This prevents UI blocking when the actual termination worked
      return NextResponse.json({ 
        success: true, 
        message: 'Conversation termination attempted (API error occurred)',
        conversationId,
        warning: 'API call failed but conversation may have ended successfully'
      });
    }

  } catch (error: unknown) {
    logError(error, 'End conversation error');
    const message = getErrorMessage(error);
    return NextResponse.json({ 
      error: message,
      details: process.env.NODE_ENV !== 'production' ? String(error) : undefined
    }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/end-conversation',
});