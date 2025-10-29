import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const tavusApiKey = process.env.TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      return NextResponse.json({ 
        error: 'Tavus API key not configured',
        hasKey: false
      }, { status: 500 });
    }

    // Test a simple API call to Tavus (list personas)
    const response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'GET',
      headers: {
        'x-api-key': tavusApiKey,
      },
    });

    return NextResponse.json({
      hasKey: true,
      keyLength: tavusApiKey.length,
      keyPrefix: tavusApiKey.substring(0, 8) + '...',
      tavusApiStatus: response.status,
      tavusApiOk: response.ok,
      message: response.ok ? 'Tavus API connection successful' : 'Tavus API connection failed'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.TAVUS_API_KEY
    }, { status: 500 });
  }
}