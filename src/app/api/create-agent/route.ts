import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, agentName, agentPersonality, agentGreeting } = await req.json();

    if (!demoId || !agentName) {
      return NextResponse.json({ error: 'Missing required agent configuration' }, { status: 400 });
    }
    
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id, user_id, metadata')
      .eq('id', demoId)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found or you do not have permission to access it.' }, { status: 404 });
    }

    if (demo.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key is not configured.' }, { status: 500 });
    }

    // Fetch knowledge base content for this demo
    const { data: knowledgeChunks, error: knowledgeError } = await supabase
      .from('knowledge_chunks')
      .select('content, chunk_type, source')
      .eq('demo_id', demoId);

    if (knowledgeError) {
      console.warn('Could not fetch knowledge base:', knowledgeError);
    }

    // Fetch available videos for this demo
    const { data: demoVideos, error: videosError } = await supabase
      .from('demo_videos')
      .select('title, transcript')
      .eq('demo_id', demoId)
      .eq('processing_status', 'completed');

    if (videosError) {
      console.warn('Could not fetch demo videos:', videosError);
    }

    // Build knowledge base context
    let knowledgeContext = '';
    if (knowledgeChunks && knowledgeChunks.length > 0) {
      knowledgeContext += '\n\n## KNOWLEDGE BASE CONTENT\n';
      
      // Add Q&A pairs
      const qaPairs = knowledgeChunks.filter((chunk: any) => chunk.chunk_type === 'qa');
      if (qaPairs.length > 0) {
        knowledgeContext += '\n### Q&A Pairs:\n';
        qaPairs.forEach((chunk: any) => {
          knowledgeContext += `${chunk.content}\n\n`;
        });
      }
      
      // Add documents
      const documents = knowledgeChunks.filter((chunk: any) => chunk.chunk_type === 'document');
      if (documents.length > 0) {
        knowledgeContext += '\n### Product Documentation:\n';
        documents.forEach((chunk: any) => {
          knowledgeContext += `**Source: ${chunk.source}**\n${chunk.content}\n\n`;
        });
      }
      
      // Add transcripts
      const transcripts = knowledgeChunks.filter((chunk: any) => chunk.chunk_type === 'transcript');
      if (transcripts.length > 0) {
        knowledgeContext += '\n### Video Transcripts:\n';
        transcripts.forEach((chunk: any) => {
          knowledgeContext += `**Source: ${chunk.source}**\n${chunk.content}\n\n`;
        });
      }
    }

    // Build available videos list
    let videosContext = '';
    if (demoVideos && demoVideos.length > 0) {
      videosContext += '\n\n## AVAILABLE VIDEOS\n';
      videosContext += 'You can show these videos using fetch_video("exact_title"):\n';
      demoVideos.forEach(video => {
        videosContext += `- "${video.title}"\n`;
        if (video.transcript) {
          videosContext += `  Transcript: ${video.transcript.substring(0, 200)}...\n`;
        }
      });
    }

    // Read base system prompt and enhance it with knowledge
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    const enhancedSystemPrompt = baseSystemPrompt + knowledgeContext + videosContext;

    console.log('Enhanced system prompt length:', enhancedSystemPrompt.length);
    console.log('Knowledge chunks:', knowledgeChunks?.length || 0);
    console.log('Available videos:', demoVideos?.length || 0);

    const personaResponse = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify({
        pipeline_mode: 'full',
        system_prompt: enhancedSystemPrompt,
        persona_name: agentName,
      }),
    });

    if (!personaResponse.ok) {
      const errorBody = await personaResponse.text();
      console.error('Tavus Persona API Error:', errorBody);
      return NextResponse.json({ error: `Failed to create Tavus persona: ${personaResponse.statusText}` }, { status: personaResponse.status });
    }

    const personaData = await personaResponse.json();
    const personaId = personaData.persona_id;

    const { error: updateError } = await supabase
      .from('demos')
      .update({ tavus_persona_id: personaId })
      .eq('id', demoId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
    }

    return NextResponse.json({ 
      message: 'Persona created successfully.',
      personaId: personaId
    });

  } catch (error: any) {
    console.error('Agent Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
