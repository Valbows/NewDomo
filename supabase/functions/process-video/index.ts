import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { FFmpeg } from 'https://esm.sh/@ffmpeg/ffmpeg';
import { fetchFile } from 'https://esm.sh/@ffmpeg/util';

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_EMBEDDING_MODEL = Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';

// TODO: Add error handling and more robust logging

serve(async (req) => {
  // 1. Get the file path from the request body
  const { record } = await req.json();
  const videoFilePath = record.key;

  // 2. Create a Supabase client
  const supabaseAdmin = createClient(
    Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
    // In Supabase Edge Functions, SUPABASE_SERVICE_ROLE_KEY is provided in env.
    // Fallback to SUPABASE_SECRET_KEY if present for local testing.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  );

  // 3. Find the video row by storage path to get demo and video IDs
  const { data: videoRow, error: videoRowError } = await supabaseAdmin
    .from('demo_videos')
    .select('id, demo_id')
    .eq('storage_url', videoFilePath)
    .single();

  if (videoRowError || !videoRow) {
    console.error('Error fetching video row:', videoRowError);
    return new Response(JSON.stringify({ error: 'Failed to find demo_video for storage key' }), { status: 404 });
  }
  const demoId = videoRow.demo_id as string;
  const demoVideoId = videoRow.id as string;

  // Mark processing start
  await supabaseAdmin
    .from('demo_videos')
    .update({ processing_status: 'processing', processing_error: null })
    .eq('id', demoVideoId);

  // 4. Download the video from Supabase Storage
  const { data: videoData, error: downloadError } = await supabaseAdmin.storage
    .from('demo-videos')
    .download(videoFilePath);

  if (downloadError) {
    console.error('Error downloading video:', downloadError);
    return new Response(JSON.stringify({ error: 'Failed to download video' }), { status: 500 });
  }

  const videoBlob = await videoData.arrayBuffer();

  // 5. Use ffmpeg.wasm to extract audio in the optimal format
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
  });

  await ffmpeg.writeFile('input.mp4', new Uint8Array(videoBlob));
  // Using .wav with pcm_s16le for better compatibility with speech-to-text APIs
  await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', 'output.wav']);
  const audioData = await ffmpeg.readFile('output.wav');

  // 6. Send audio to ElevenLabs for transcription
  const formData = new FormData();
  formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');
  formData.append('model', 'scribe_v1'); // Use the correct speech-to-text model

  const elevenlabsResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text/stream', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!elevenlabsResponse.ok || !elevenlabsResponse.body) {
    const errorBody = await elevenlabsResponse.text();
    console.error('ElevenLabs API error:', errorBody);
    return new Response(JSON.stringify({ error: 'Failed to transcribe audio' }), { status: 500 });
  }

  // Handle the streaming response correctly
  const reader = elevenlabsResponse.body.getReader();
  const decoder = new TextDecoder();
  let fullTranscript = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Assuming the stream sends JSON objects or similar structured data per chunk
    // This part might need adjustment based on the actual stream format from ElevenLabs
    try {
      const json = JSON.parse(chunk);
      if (json.transcript) {
        fullTranscript += json.transcript + ' ';
      }
    } catch (e) {
      // If chunk is not a valid JSON, it might be part of a larger JSON object or just text.
      // For this implementation, we'll assume each chunk is a self-contained JSON.
      console.warn('Could not parse stream chunk as JSON:', chunk);
    }
  }

  const transcript = fullTranscript.trim();

  // 7. Store the transcript in the database
  // 7a. Persist transcript on the video row for quick access
  const { error: videoUpdateError } = await supabaseAdmin
    .from('demo_videos')
    .update({ transcript })
    .eq('id', demoVideoId);
  if (videoUpdateError) {
    console.error('Error updating video transcript:', videoUpdateError);
  }

  // 7b. Chunk transcript and generate embeddings (with graceful fallback)
  const MAX_CHUNK_CHARS = 2000;
  const chunks: string[] = [];
  for (let i = 0; i < transcript.length; i += MAX_CHUNK_CHARS) {
    const part = transcript.slice(i, i + MAX_CHUNK_CHARS).trim();
    if (part) chunks.push(part);
  }

  const baseRows = chunks.map((content) => ({
    demo_id: demoId,
    content,
    chunk_type: 'transcript' as const,
    source: `video:${demoVideoId}`,
  }));

  let insertErr: unknown = null;
  if (OPENAI_API_KEY && baseRows.length > 0) {
    try {
      const resp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_EMBEDDING_MODEL,
          input: chunks,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        const vectors: number[][] = (json?.data || []).map((d: any) => d?.embedding ?? []);
        const rowsWithVectors = baseRows.map((row, idx) => ({
          ...row,
          vector_embedding: vectors[idx] ?? null,
        }));
        const { error } = await supabaseAdmin.from('knowledge_chunks').insert(rowsWithVectors);
        insertErr = error;
      } else {
        console.error('OpenAI embeddings HTTP error:', resp.status, await resp.text());
        const { error } = await supabaseAdmin.from('knowledge_chunks').insert(baseRows);
        insertErr = error;
      }
    } catch (e) {
      console.error('OpenAI embeddings request failed:', e);
      const { error } = await supabaseAdmin.from('knowledge_chunks').insert(baseRows);
      insertErr = error;
    }
  } else if (baseRows.length > 0) {
    const { error } = await supabaseAdmin.from('knowledge_chunks').insert(baseRows);
    insertErr = error;
  }

  if (insertErr) {
    console.error('Error inserting transcript knowledge chunks:', insertErr);
    await supabaseAdmin
      .from('demo_videos')
      .update({ processing_status: 'failed', processing_error: 'Failed to save transcript chunks' })
      .eq('id', demoVideoId);
    return new Response(JSON.stringify({ error: 'Failed to save transcript chunks' }), { status: 500 });
  }

  // Mark processing completed
  await supabaseAdmin
    .from('demo_videos')
    .update({ processing_status: 'completed' })
    .eq('id', demoVideoId);

  return new Response(JSON.stringify({ success: true, transcript, demo_id: demoId, demo_video_id: demoVideoId }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
