import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { videoService } from '@/lib/services/demos';

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body.demo_video_id;
    
    if (!rawId || typeof rawId !== 'string') {
      return NextResponse.json({ error: 'Missing demo_video_id' }, { status: 400 });
    }

    // Use video service to process transcription
    const result = await videoService.processVideoTranscription(rawId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Transcription process completed successfully.',
      videoId: result.data.videoId,
      transcript: result.data.transcript,
      chunksCreated: result.data.chunksCreated
    });

  } catch (error: unknown) {
    logError(error, 'Transcription Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/admin/utilities/transcribe',
});