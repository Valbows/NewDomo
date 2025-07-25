import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { script, voice_id } = await request.json();

  if (!script || !voice_id) {
    return NextResponse.json({ error: 'Missing script or voice_id' }, { status: 400 });
  }

  const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
  const TAVUS_BASE_URL = process.env.TAVUS_BASE_URL || 'https://api.tavus.io/v2';

  if (!TAVUS_API_KEY) {
    return NextResponse.json({ error: 'Tavus API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${TAVUS_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script,
        voice_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create video', details: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Tavus API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
