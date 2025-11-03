import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function handleGET(req: NextRequest) {
  try {
    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || 'cd9c38359945c4ec'; // Default to your conversation

    console.log(`🔍 Debugging Tavus conversation: ${conversationId}`);

    // Test main conversation endpoint with verbose=true
    const mainResponse = await fetch(
      `https://tavusapi.com/v2/conversations/${conversationId}?verbose=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      }
    );

    const debug = {
      conversationId,
      mainEndpoint: {
        url: `https://tavusapi.com/v2/conversations/${conversationId}?verbose=true`,
        status: mainResponse.status,
        ok: mainResponse.ok,
        data: null as any,
        error: null as any,
        analysis: {
          has_transcript: false,
          transcript_entries: 0,
          has_perception: false,
          perception_fields: [] as string[]
        }
      }
    };

    // Get main conversation data
    if (mainResponse.ok) {
      debug.mainEndpoint.data = await mainResponse.json();
      
      // Analyze the response for transcript and perception data
      const data = debug.mainEndpoint.data;
      if (data && data.transcript) {
        debug.mainEndpoint.analysis.has_transcript = true;
        debug.mainEndpoint.analysis.transcript_entries = Array.isArray(data.transcript) ? data.transcript.length : 1;
      }
      
      if (data && data.application && data.application.perception_analysis) {
        debug.mainEndpoint.analysis.has_perception = true;
        debug.mainEndpoint.analysis.perception_fields = Object.keys(data.application.perception_analysis);
      }
    } else {
      debug.mainEndpoint.error = await mainResponse.text();
    }

    // Note: With verbose=true, transcript and perception data should be in the main response
    console.log('ℹ️ Using verbose=true parameter - no need to test separate endpoints');
    
    if (debug.mainEndpoint.data) {
      console.log('📊 Analysis results:');
      console.log(`- Transcript: ${debug.mainEndpoint.analysis.has_transcript ? `✅ ${debug.mainEndpoint.analysis.transcript_entries} entries` : '❌ Not found'}`);
      console.log(`- Perception: ${debug.mainEndpoint.analysis.has_perception ? `✅ Found (${debug.mainEndpoint.analysis.perception_fields.join(', ')})` : '❌ Not found'}`);
    }

    return NextResponse.json(debug, { status: 200 });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;