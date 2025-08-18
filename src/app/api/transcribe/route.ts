import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as Sentry from '@sentry/nextjs';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();
  let demo_video_id;

  try {
    const body = await req.json();
    demo_video_id = body.demo_video_id;

    if (!demo_video_id) {
      return NextResponse.json({ error: 'Missing demo_video_id' }, { status: 400 });
    }

    // 1. Update video status to 'processing'
    await supabase
      .from('demo_videos')
      .update({ processing_status: 'processing', processing_error: null })
      .eq('id', demo_video_id);

    

    // TODO: Add ElevenLabs transcription logic here

    // 2. Fetch video details
    const { data: video, error: videoError } = await supabase
      .from('demo_videos')
      .select('storage_url')
      .eq('id', demo_video_id)
      .single();

    if (videoError || !video) {
      throw new Error('Failed to retrieve video from database.');
    }

    // 3. Download video from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('demo-videos')
      .download(video.storage_url);

    if (downloadError || !fileData) {
      throw new Error('Failed to download video from storage.');
    }
    
    // 4. Transcribe the audio using ElevenLabs
    const elevenlabs = new ElevenLabsClient(); // API key is read from ELEVENLABS_API_KEY env var

    const transcriptionResponse = await elevenlabs.speechToText.convert({
      file: fileData,
      modelId: 'scribe_v1'
    });

    if (!transcriptionResponse || !transcriptionResponse.text) {
        throw new Error('Failed to transcribe audio with ElevenLabs.');
    }

    const transcript = transcriptionResponse.text;

    // 5. Insert transcript into knowledge_chunks
    const { data: videoData } = await supabase.from('demo_videos').select('demo_id').eq('id', demo_video_id).single();
    
    await supabase.from('knowledge_chunks').insert({
      demo_id: videoData?.demo_id,
      content: transcript,
      chunk_type: 'transcript',
      source: `video:${demo_video_id}`,
    });

    // 6. Update video status to 'completed'
    await supabase
      .from('demo_videos')
      .update({ processing_status: 'completed' })
      .eq('id', demo_video_id);

    return NextResponse.json({ message: 'Transcription process completed successfully.' });

  } catch (error: unknown) {
    console.error('Transcription Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (demo_video_id) {
      await supabase
        .from('demo_videos')
        .update({ processing_status: 'failed', processing_error: message })
        .eq('id', demo_video_id);
    }
    Sentry.captureException(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/transcribe',
});
