import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';
// Conditional Sentry import - fallback gracefully if not available
let Sentry: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/nextjs');
} catch (e) {
  // Sentry not available; will fallback to console logging
}
import { getErrorMessage, logError } from '@/lib/errors';

async function handleGET(req: NextRequest) {
  const supabase = createClient();

  try {
    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId') || url.searchParams.get('demo_id');
    const videoTitle =
      url.searchParams.get('title') || url.searchParams.get('videoTitle') || 'Fourth Video';

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    const { data: video, error: videoError } = await supabase
      .from('demo_videos')
      .select('id, title, storage_url')
      .eq('demo_id', demoId)
      .eq('title', videoTitle)
      .single();

    if (videoError || !video) {
      // Also return available titles to help with testing
      const { data: available } = await supabase
        .from('demo_videos')
        .select('id, title')
        .eq('demo_id', demoId);

      return NextResponse.json(
        {
          error: `Video not found for title '${videoTitle}'.`,
          availableVideos: available?.map((v) => ({ id: v.id, title: v.title })) ?? [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: video.id,
      title: video.title,
      storageUrl: video.storage_url,
    });
  } catch (error: unknown) {
    logError(error, 'Find video id error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = Sentry.wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/admin/utilities/find-video-id',
});