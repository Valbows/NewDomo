import { NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

async function handleGET() {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const ELEVENLABS_URL = process.env.ELEVENLABS_URL || 'https://api.elevenlabs.io/v1';

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${ELEVENLABS_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch voices from ElevenLabs', details: data }, { status: response.status });
    }

    return NextResponse.json(data.voices);
  } catch (error: unknown) {
    logError(error, 'ElevenLabs API error');
    const message = getErrorMessage(error, 'An unexpected error occurred');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/elevenlabs/voices',
});
