import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import OpenAI from 'openai';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();
  let demo_video_id: string | null = null;

  try {
    const body = await req.json();
    const rawId = body.demo_video_id;
    // module_id can be passed explicitly or inherited from the video record
    const requestModuleId = body.module_id || null;

    if (!rawId || typeof rawId !== 'string') {
      return NextResponse.json({ error: 'Missing demo_video_id' }, { status: 400 });
    }
    demo_video_id = rawId;

    // 1. Update video status to 'processing'
    await supabase
      .from('demo_videos')
      .update({ processing_status: 'processing', processing_error: null })
      .eq('id', demo_video_id);

    

    // TODO: Add ElevenLabs transcription logic here

    // 2. Fetch video details including module_id
    const { data: video, error: videoError } = await supabase
      .from('demo_videos')
      .select('storage_url, module_id')
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

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('[Transcribe] ELEVENLABS_API_KEY is not set');
      throw new Error('Transcription service not configured. Please contact support.');
    }

    let transcriptionResponse;
    try {
      transcriptionResponse = await elevenlabs.speechToText.convert({
        file: fileData,
        modelId: 'scribe_v1'
      });
    } catch (elevenLabsError: any) {
      // Log detailed error for debugging (shows in Render logs)
      console.error('[Transcribe] ElevenLabs API error:', {
        message: elevenLabsError?.message,
        status: elevenLabsError?.status || elevenLabsError?.statusCode,
        body: elevenLabsError?.body,
        name: elevenLabsError?.name,
      });

      // Re-throw with more context
      const statusCode = elevenLabsError?.status || elevenLabsError?.statusCode;
      if (statusCode === 401) {
        throw new Error('Transcription service authentication failed. Invalid API key.');
      } else if (statusCode === 429) {
        throw new Error('Transcription service rate limit exceeded. Please try again later.');
      } else if (statusCode === 400) {
        throw new Error('Invalid audio format or file. Please upload a supported video format.');
      } else {
        throw elevenLabsError;
      }
    }

    // Handle different response types from ElevenLabs SDK
    // The response can be SpeechToTextChunkResponseModel or MultichannelSpeechToTextResponseModel
    let transcript: string;
    const response = transcriptionResponse as any;

    if (response.text) {
      transcript = response.text;
    } else if (response.channels && Array.isArray(response.channels)) {
      // Multichannel response - combine all channel transcripts
      transcript = response.channels
        .map((ch: any) => ch.text || '')
        .filter(Boolean)
        .join(' ');
    } else {
      throw new Error(process.env.NODE_ENV !== 'production'
        ? 'Failed to transcribe audio with ElevenLabs - unexpected response format.'
        : 'Failed to transcribe audio.');
    }

    if (!transcript) {
      throw new Error(process.env.NODE_ENV !== 'production'
        ? 'Failed to transcribe audio with ElevenLabs.'
        : 'Failed to transcribe audio.');
    }

    // Persist transcript on the video record for quick access
    await supabase
      .from('demo_videos')
      .update({ transcript })
      .eq('id', demo_video_id);

    // 5. Insert transcript into knowledge_chunks with embeddings (chunked)
    const { data: videoData } = await supabase
      .from('demo_videos')
      .select('demo_id')
      .eq('id', demo_video_id)
      .single();

    const demoId = videoData?.demo_id;

    // Basic chunking to respect embedding input limits
    const MAX_CHUNK_CHARS = 2000;
    const chunks: string[] = [];
    for (let i = 0; i < transcript.length; i += MAX_CHUNK_CHARS) {
      const chunk = transcript.slice(i, i + MAX_CHUNK_CHARS).trim();
      if (chunk) chunks.push(chunk);
    }

    const videoIdForSource = demo_video_id!; // non-null after validation above
    // Use module_id from request, or inherit from video record
    const effectiveModuleId = requestModuleId || video?.module_id || null;

    const rowsBase = chunks.map((chunk) => ({
      demo_id: demoId,
      content: chunk,
      chunk_type: 'transcript' as const,
      source: `video:${videoIdForSource}`,
      module_id: effectiveModuleId,
    }));

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

    try {
      if (openaiApiKey && chunks.length > 0) {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const embedResp = await openai.embeddings.create({
          model: embeddingModel,
          input: chunks,
        });

        const rowsWithVectors = rowsBase.map((row, idx) => ({
          ...row,
          vector_embedding: embedResp.data[idx]?.embedding,
        }));

        await supabase.from('knowledge_chunks').insert(rowsWithVectors);
      } else {
        // Insert without embeddings if API key is missing
        if (rowsBase.length > 0) {
          await supabase.from('knowledge_chunks').insert(rowsBase);
        }
      }
    } catch (embeddingErr) {
      // Fall back: insert without vectors if embedding step fails
      console.error('Embedding generation failed; inserting without vectors:', embeddingErr);
      if (rowsBase.length > 0) {
        await supabase.from('knowledge_chunks').insert(rowsBase);
      }
    }

    // 6. Update video status to 'completed'
    await supabase
      .from('demo_videos')
      .update({ processing_status: 'completed' })
      .eq('id', demo_video_id);

    return NextResponse.json({ message: 'Transcription process completed successfully.' });

  } catch (error: unknown) {
    logError(error, 'Transcription Error');
    const rawMessage = getErrorMessage(error);

    // Sanitize error message for production - don't expose third-party service details
    let userMessage: string;
    if (process.env.NODE_ENV !== 'production') {
      // In development, show full error for debugging
      userMessage = rawMessage;
    } else {
      // In production, show generic error messages
      const lowerMessage = rawMessage.toLowerCase();
      if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized') || lowerMessage.includes('api key')) {
        userMessage = 'Transcription service authentication failed. Please contact support.';
      } else if (lowerMessage.includes('429') || lowerMessage.includes('rate limit') || lowerMessage.includes('quota')) {
        userMessage = 'Transcription service is temporarily unavailable. Please try again later.';
      } else if (lowerMessage.includes('unusual activity') || lowerMessage.includes('abuse') || lowerMessage.includes('free tier')) {
        userMessage = 'Transcription service is temporarily unavailable. Please try again later.';
      } else if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {
        userMessage = 'Transcription service connection failed. Please try again.';
      } else {
        userMessage = 'Failed to transcribe audio. Please try again or contact support.';
      }
    }

    if (demo_video_id) {
      await supabase
        .from('demo_videos')
        .update({ processing_status: 'failed', processing_error: userMessage })
        .eq('id', demo_video_id);
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/transcribe',
});
