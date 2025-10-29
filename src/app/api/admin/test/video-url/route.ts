import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { videoService } from '@/lib/services/demos';

async function handleGET(req: NextRequest) {
  try {
    // Get the demo ID from query params
    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');
    const videoTitle = url.searchParams.get('videoTitle') || 'Fourth Video';

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Use video service to generate URL
    const result = await videoService.generateVideoUrl(demoId, videoTitle);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      videoUrl: result.data.videoUrl,
      storageUrl: result.data.storageUrl,
      message: 'Video URL generated successfully'
    });

  } catch (error: unknown) {
    logError(error, 'Test video URL error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/admin/test/video-url',
});