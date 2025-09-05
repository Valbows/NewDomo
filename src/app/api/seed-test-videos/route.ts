import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';

async function handleGET(req: NextRequest) {
  const supabase = createClient();

  try {
    const url = new URL(req.url);
    const targetKey = url.searchParams.get('key') || 'test-videos/fourth-video.mp4';
    const sourceUrl =
      url.searchParams.get('url') ||
      'https://samplelib.com/lib/preview/mp4/sample-5s.mp4';

    // Fetch a small public sample MP4
    const resp = await fetch(sourceUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: `Failed to download sample from ${sourceUrl}` }, { status: 502 });
    }
    const arrayBuf = await resp.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuf);

    // Upload to Supabase Storage (demo-videos bucket)
    const { data, error } = await supabase.storage
      .from('demo-videos')
      .upload(targetKey, fileBytes, { contentType: 'video/mp4', upsert: true });

    if (error) {
      logError(error, 'Seed test videos upload error');
      return NextResponse.json({ error: getErrorMessage(error, 'Upload failed') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bucket: 'demo-videos',
      key: targetKey,
      sourceUrl,
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
