import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/errors';

// Debug logging helper (only in development)
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[BulkAssignModule] ${message}`, data !== undefined ? data : '');
  }
};

/**
 * PATCH /api/content/bulk-assign-module
 *
 * Bulk assign videos and/or knowledge chunks to a module.
 *
 * Request body:
 * {
 *   videoIds?: string[];
 *   knowledgeChunkIds?: string[];
 *   moduleId: string | null;
 * }
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const body = await req.json();
    const { videoIds, knowledgeChunkIds, moduleId } = body;

    debugLog('Request received', {
      videoIds: videoIds?.length || 0,
      knowledgeChunkIds: knowledgeChunkIds?.length || 0,
      moduleId,
    });

    if (!videoIds?.length && !knowledgeChunkIds?.length) {
      return NextResponse.json(
        { error: 'At least one videoId or knowledgeChunkId is required' },
        { status: 400 }
      );
    }

    const results = {
      videosUpdated: 0,
      chunksUpdated: 0,
      errors: [] as string[],
    };

    // Update videos
    if (videoIds && videoIds.length > 0) {
      debugLog('Updating videos', { count: videoIds.length, moduleId });
      const { error: videoError, count } = await supabase
        .from('demo_videos')
        .update({ module_id: moduleId })
        .in('id', videoIds);

      if (videoError) {
        debugLog('Video update error', { error: videoError.message });
        results.errors.push(`Videos: ${videoError.message}`);
      } else {
        results.videosUpdated = count || videoIds.length;
        debugLog('Videos updated', { count: results.videosUpdated });
      }
    }

    // Update knowledge chunks
    if (knowledgeChunkIds && knowledgeChunkIds.length > 0) {
      debugLog('Updating knowledge chunks', { count: knowledgeChunkIds.length, moduleId });
      const { error: chunkError, count } = await supabase
        .from('knowledge_chunks')
        .update({ module_id: moduleId })
        .in('id', knowledgeChunkIds);

      if (chunkError) {
        debugLog('Chunk update error', { error: chunkError.message });
        results.errors.push(`Knowledge chunks: ${chunkError.message}`);
      } else {
        results.chunksUpdated = count || knowledgeChunkIds.length;
        debugLog('Chunks updated', { count: results.chunksUpdated });
      }
    }

    if (results.errors.length > 0 && results.videosUpdated === 0 && results.chunksUpdated === 0) {
      return NextResponse.json(
        { error: results.errors.join('; ') },
        { status: 500 }
      );
    }

    debugLog('Bulk assignment complete', results);

    return NextResponse.json({
      success: true,
      videosUpdated: results.videosUpdated,
      chunksUpdated: results.chunksUpdated,
      moduleId,
      warnings: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('[BulkAssignModule] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
