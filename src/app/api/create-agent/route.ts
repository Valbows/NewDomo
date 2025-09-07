import { NextRequest, NextResponse } from 'next/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { createClient } from '@/utils/supabase/server';
import { getErrorMessage, logError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

async function handlePOST(req: NextRequest) {
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

    // Read base system prompt and enhance it with identity, objectives, knowledge, and videos
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    // Identity section sourced from UI inputs
    const identitySection = `\n\n## AGENT PROFILE\n- Name: ${agentName}\n- Personality: ${agentPersonality || 'Friendly and helpful assistant.'}\n- Initial Greeting (use at start of conversation): ${agentGreeting || 'Hello! How can I help you with the demo today?'}\n`;

    // Objectives section sourced from demo metadata (3–5 concise goals)
    const objectivesList: string[] = Array.isArray(demo.metadata?.objectives)
      ? (demo.metadata!.objectives as string[]).filter((s) => typeof s === 'string' && s.trim()).slice(0, 5)
      : [];
    const objectivesSection = objectivesList.length
      ? `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation. Weave them naturally into dialog and video choices.\n${objectivesList
          .map((o, i) => `- (${i + 1}) ${o.trim()}`)
          .join('\n')}\n`
      : '';

    // Language handling guidance (multilingual smart detection)
    const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language from their utterances and respond in that language.\n- Keep all tool calls and their arguments (function names, video titles) EXACT and un-translated.\n- Do not ask the user to choose a language; infer it from context and switch seamlessly while honoring all guardrails.\n`;

    const enhancedSystemPrompt = baseSystemPrompt + identitySection + objectivesSection + languageSection + knowledgeContext + videosContext;

    console.log('Enhanced system prompt length:', enhancedSystemPrompt.length);
    console.log('Knowledge chunks:', knowledgeChunks?.length || 0);
    console.log('Available videos:', demoVideos?.length || 0);
    
    // Log guardrails section for verification
    const guardrailsSection = enhancedSystemPrompt.match(/## GUARDRAILS \(Critical\)(.*?)(?=##|$)/s);
    if (guardrailsSection) {
      console.log('✅ Guardrails section found in system prompt');
      console.log('Guardrails length:', guardrailsSection[0].length);
    } else {
      console.warn('⚠️  Guardrails section NOT found in system prompt');
    }

    const allowedTitles = (demoVideos || []).map(v => v.title).filter(Boolean);

    // Define tools for the persona (optional via env toggle)
    // By default, tools remain disabled to avoid persona validation errors observed previously.
    const tavusToolsEnabled = process.env.TAVUS_TOOLS_ENABLED === 'true';
    let tools: any[] = [];
    if (tavusToolsEnabled) {
      // Allow a minimal toolset during initial validation to reduce failure risk
      const tavusMinimalTools = process.env.TAVUS_MINIMAL_TOOLS === 'true';

      // Build the title property with an enum of allowed titles when available
      const titleProperty: any = {
        type: 'string',
        description: 'Exact title of the video to fetch. Must match one of the listed video titles.'
      };
      if (Array.isArray(allowedTitles) && allowedTitles.length > 0) {
        titleProperty.enum = allowedTitles;
      }

      const fetchVideoTool = {
        type: 'function',
        function: {
          name: 'fetch_video',
          description: 'Fetch and display a demo video by exact title. Use when the user asks to see a specific video or feature demo.',
          parameters: {
            type: 'object',
            properties: {
              title: titleProperty
            },
            required: ['title']
          }
        }
      };

      tools = [fetchVideoTool];

      if (!tavusMinimalTools) {
        tools.push(
          {
            type: 'function',
            function: {
              name: 'pause_video',
              description: 'Pause the currently playing demo video.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'play_video',
              description: 'Resume playing the currently paused demo video.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'next_video',
              description: 'Stop current video and play the next available demo video in sequence.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'close_video',
              description: 'Close the video player and return to full-screen conversation.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'show_trial_cta',
              description: 'Show call-to-action for starting a trial when user expresses interest.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          }
        );
      }
    }
    // Debug: log tool enablement and included tool names
    try {
      console.log('Tavus tools enabled:', tavusToolsEnabled, 'Tool names:', tools.map((t: any) => t?.function?.name).filter(Boolean));
    } catch {}

    // Configure LLM model (upgrade to tavus-llama-4 by default, env overrideable)
    const tavusLlmModel = process.env.TAVUS_LLM_MODEL || 'tavus-llama-4';
    console.log('Using Tavus LLM model:', tavusLlmModel);
    
    /* Disabled tools - causing validation error:
    const tools = [
      {
        type: 'function',
        function: {
          name: 'fetch_video',
          description: 'Fetch and display a demo video by title. Use this when the user asks to see a video, demo, or specific feature.',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The exact title of the video to fetch. Must match one of the available video titles exactly.'
              }
            },
            required: ['title']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'show_trial_cta',
          description: 'Show a call-to-action for starting a trial. Use this when the user expresses interest in trying the product.',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
    ];
    */

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
        layers: {
          llm: {
            model: tavusLlmModel,
            tools: tools
          }
        }
      }),
    });

    if (!personaResponse.ok) {
      const errorBody = await personaResponse.text();
      logError(errorBody, 'Tavus Persona API Error');
      return NextResponse.json({ error: `Failed to create Tavus persona: ${personaResponse.statusText}` }, { status: personaResponse.status });
    }

    const personaData = await personaResponse.json();
    const personaId = personaData.persona_id;

    const { error: updateError } = await supabase
      .from('demos')
      .update({ tavus_persona_id: personaId })
      .eq('id', demoId);

    if (updateError) {
        logError(updateError, 'Supabase update error');
        throw updateError;
    }

    return NextResponse.json({ 
      message: 'Persona created successfully.',
      personaId: personaId
    });

  } catch (error: unknown) {
    logError(error, 'Agent Creation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/create-agent',
});
