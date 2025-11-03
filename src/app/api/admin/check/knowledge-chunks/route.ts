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
    const videoId = url.searchParams.get('videoId') || url.searchParams.get('video_id');

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Base filters
    const baseFilters = (query: any) => {
      query = query.eq('demo_id', demoId).eq('chunk_type', 'transcript');
      if (videoId) {
        query = query.eq('source', `video:${videoId}`);
      }
      return query;
    };

    // Total transcript chunks
    const { count: totalCount, error: totalErr } = await baseFilters(
      supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true })
    );
    if (totalErr) throw totalErr;

    // Embedded chunks (vector not null)
    const { count: embeddedCount, error: embedErr } = await baseFilters(
      supabase
        .from('knowledge_chunks')
        .select('id', { count: 'exact', head: true })
        .not('vector_embedding', 'is', null)
    );
    if (embedErr) throw embedErr;

    // Sample rows
    const { data: samples } = await baseFilters(
      supabase
        .from('knowledge_chunks')
        .select('id, source, left(content, 120) as preview, vector_embedding')
        .limit(2)
    );

    return NextResponse.json({
      demoId,
      videoId,
      totalTranscriptChunks: totalCount || 0,
      embeddedChunks: embeddedCount || 0,
      missingEmbeddings: (totalCount || 0) - (embeddedCount || 0),
      samples: (samples || []).map((s: any) => ({
        id: s.id,
        source: s.source,
        preview: s.preview,
        hasEmbedding: Array.isArray(s.vector_embedding) || s.vector_embedding !== null,
      })),
    });
  } catch (error: unknown) {
    logError(error, 'Check knowledge chunks error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = Sentry.wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/admin/check/knowledge-chunks',
});