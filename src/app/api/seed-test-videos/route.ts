import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';
import { videoService } from '@/lib/services/demos';

async function handleGET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetKey = url.searchParams.get('key') || 'test-videos/fourth-video.mp4';
    const sourceUrl = url.searchParams.get('url') || 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4';

    // Use video service to upload test video
    const result = await videoService.uploadTestVideo(targetKey, sourceUrl);

    if (!result.success) {
      const status = result.code === 'EXTERNAL_API_ERROR' ? 502 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      bucket: result.data.bucket,
      key: result.data.key,
      sourceUrl: result.data.sourceUrl,
      message: 'Sample video uploaded to storage.'
    });

  } catch (error: unknown) {
    logError(error, 'Seed test videos error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = Sentry.wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/seed-test-videos',
});
