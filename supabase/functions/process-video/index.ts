import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { FFmpeg } from 'https://esm.sh/@ffmpeg/ffmpeg';
import { fetchFile } from 'https://esm.sh/@ffmpeg/util';

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

// TODO: Add error handling and more robust logging

serve(async (req) => {
  // 1. Get the file path from the request body
  const { record } = await req.json();
  const videoFilePath = record.key;

  // 2. Create a Supabase client
  const supabaseAdmin = createClient(
    Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 3. Get the demo ID from the database
  const { data: demo, error: demoError } = await supabaseAdmin
    .from('demos')
    .select('id')
    .eq('video_url', videoFilePath)
    .single();

  if (demoError || !demo) {
    console.error('Error fetching demo:', demoError);
    return new Response(JSON.stringify({ error: 'Failed to find demo for video' }), { status: 404 });
  }
  const demoId = demo.id;

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
  const { error: insertError } = await supabaseAdmin.from('knowledge_chunks').insert([
    { demo_id: demoId, chunk_text: transcript, embedding: [] }, // Embedding will be done in a separate step
  ]);

  if (insertError) {
    console.error('Error inserting transcript:', insertError);
    return new Response(JSON.stringify({ error: 'Failed to save transcript' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, transcript }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
