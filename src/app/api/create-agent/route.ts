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

    const { demoId, agentName, agentPersonality, agentGreeting, knowledgeChunks } = await req.json();

    if (!demoId || !agentName || !knowledgeChunks) {
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

    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    const personaResponse = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify({
        pipeline_mode: 'full',
        system_prompt: systemPrompt,
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
