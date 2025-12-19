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

      // Log for debugging
      console.log('🔍 Conversation ID validation:', {
        provided: conversationId,
        stored: demo.tavus_conversation_id,
        match: demo.tavus_conversation_id === conversationId
      });

      // Handle conversation ID resolution
      if (!conversationId && demo.tavus_conversation_id) {
        // No conversation ID provided, use the stored one
        console.log('🔄 Using stored conversation ID from demo');
        conversationId = demo.tavus_conversation_id;
      } else if (demo.tavus_conversation_id !== conversationId) {
        // IDs don't match, prefer the stored one if it exists
        if (demo.tavus_conversation_id) {
          console.log('🔄 Conversation ID mismatch, using stored ID from demo');
          conversationId = demo.tavus_conversation_id;
        } else {
          console.warn('⚠️ No stored conversation ID in demo, using provided ID');
        }
      }
    } else if (!conversationId) {
      // No demoId provided and no conversationId
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    // Final validation - ensure we have a conversation ID
    if (!conversationId || conversationId.trim() === '') {
      console.error('❌ No valid conversation ID found');
      return NextResponse.json({ error: 'No valid conversation ID found' }, { status: 400 });
    }

    // Additional validation - check if conversation ID looks valid
    if (conversationId === 'null' || conversationId === 'undefined') {
      console.error('❌ Conversation ID is null or undefined string');
      return NextResponse.json({ error: 'Invalid conversation ID (null/undefined)' }, { status: 400 });
    }

    console.log('🎯 Final conversation ID to end:', conversationId);

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      console.error('❌ Tavus API key not configured');
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    console.log('🔑 Tavus API key configured, proceeding with conversation check');

    // Try to end the conversation via Tavus API with robust error handling
    try {
      console.log('🔍 Checking conversation status on Tavus...');
      const getResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'x-api-key': tavusApiKey,
        },
      });
      
      console.log('📡 Tavus GET response status:', getResponse.status);

      if (!getResponse.ok) {
        if (getResponse.status === 404) {
          console.log('🔍 Conversation not found on Tavus, might already be ended');
          // Clear stale data since conversation doesn't exist
          if (demoId) {
            try {
              const { data: currentDemo } = await supabase
                .from('demos')
                .select('metadata')
                .eq('id', demoId)
                .single();

              if (currentDemo) {
                const currentMetadata = typeof currentDemo.metadata === 'string'
                  ? JSON.parse(currentDemo.metadata)
                  : (currentDemo.metadata || {});

                const { tavusShareableLink, ...restMetadata } = currentMetadata;

                await supabase
                  .from('demos')
                  .update({
                    tavus_conversation_id: null,
                    metadata: restMetadata
                  })
                  .eq('id', demoId);

                console.log('🧹 Cleared stale conversation data (404 case)');
              }
            } catch (clearError) {
              console.warn('⚠️ Failed to clear stale conversation data:', clearError);
            }
          }
          return NextResponse.json({
            success: true,
            message: 'Conversation not found (might already be ended)',
            conversationId
          });
        }
        console.warn(`⚠️ Tavus API error: ${getResponse.status}, proceeding to attempt end anyway`);
      } else {
        const conversationData = await getResponse.json();

        // If conversation is already ended, return success and clear stale data
        if (conversationData.status === 'ended' || conversationData.status === 'completed') {
          // Clear stale data since conversation is already ended
          if (demoId) {
            try {
              const { data: currentDemo } = await supabase
                .from('demos')
                .select('metadata')
                .eq('id', demoId)
                .single();

              if (currentDemo) {
                const currentMetadata = typeof currentDemo.metadata === 'string'
                  ? JSON.parse(currentDemo.metadata)
                  : (currentDemo.metadata || {});

                const { tavusShareableLink, ...restMetadata } = currentMetadata;

                await supabase
                  .from('demos')
                  .update({
                    tavus_conversation_id: null,
                    metadata: restMetadata
                  })
                  .eq('id', demoId);

                console.log('🧹 Cleared stale conversation data (already ended case)');
              }
            } catch (clearError) {
              console.warn('⚠️ Failed to clear stale conversation data:', clearError);
            }
          }
          return NextResponse.json({
            success: true,
            message: 'Conversation already ended',
            status: conversationData.status
          });
        }
      }

      // End the conversation via Tavus API
      console.log('🛑 Attempting to end conversation via Tavus API...');
      const endResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      });
      
      console.log('📡 Tavus END response status:', endResponse.status);

      if (!endResponse.ok) {
        const errorText = await endResponse.text();
        console.warn(`⚠️ Tavus end conversation error: ${endResponse.status} - ${errorText}`);
        
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
      
      console.log(`✅ Successfully ended Tavus conversation: ${conversationId}`);

      // Clear the stale conversation URL from the database so next visit creates a fresh conversation
      if (demoId) {
        try {
          const { data: currentDemo } = await supabase
            .from('demos')
            .select('metadata')
            .eq('id', demoId)
            .single();

          if (currentDemo) {
            const currentMetadata = typeof currentDemo.metadata === 'string'
              ? JSON.parse(currentDemo.metadata)
              : (currentDemo.metadata || {});

            // Remove the stale shareable link
            const { tavusShareableLink, ...restMetadata } = currentMetadata;

            await supabase
              .from('demos')
              .update({
                tavus_conversation_id: null,
                metadata: restMetadata
              })
              .eq('id', demoId);

            console.log('🧹 Cleared stale conversation data from demo');
          }
        } catch (clearError) {
          console.warn('⚠️ Failed to clear stale conversation data:', clearError);
          // Don't fail the request for this
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation ended successfully',
        conversationId,
        result: endResult
      });

    } catch (tavusError) {
      console.error('❌ Tavus API call failed:', tavusError);
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
    console.error('❌ End conversation error:', error);
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