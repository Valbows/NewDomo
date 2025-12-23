/**
 * Enhanced Agent Creation API
 * Automatically integrates: System Prompt + Guardrails + Preset Objectives + Custom Objectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { getWebhookUrl } from '@/lib/tavus/webhook-objectives';

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, agentName, agentPersonality, agentGreeting } = await req.json();

    if (!demoId || !agentName) {
      return NextResponse.json({ error: 'Demo ID and agent name are required' }, { status: 400 });
    }

    console.log('🤖 CREATING ENHANCED AGENT');
    console.log('='.repeat(50));
    console.log(`Demo ID: ${demoId}`);
    console.log(`Agent Name: ${agentName}`);
    console.log(`🔗 Webhook URL: ${getWebhookUrl()}`);
    console.log('📋 Objectives will automatically include webhook URLs for data collection');

    // Step 1: Verify demo ownership
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .eq('user_id', user.id)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found or access denied' }, { status: 404 });
    }

    console.log(`✅ Demo verified: ${demo.name}`);

    // Step 2: Check for active custom objectives and validate override behavior
    console.log('\n🎯 Checking Custom Objectives...');
    let activeCustomObjective = null;
    try {
      const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
      const { validateObjectivesOverride } = await import('@/lib/tavus/custom-objectives-integration');
      
      activeCustomObjective = await getActiveCustomObjective(demoId);
      
      // Validate the override logic
      const validation = await validateObjectivesOverride(demoId);
      console.log(`🔍 Objectives Override Validation: ${validation.overrideStatus}`);
      
      if (activeCustomObjective) {
        console.log(`✅ Active custom objective: ${activeCustomObjective.name}`);
        console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
        console.log(`   Tavus ID: ${activeCustomObjective.tavus_objectives_id}`);
        console.log(`   🎯 WILL OVERRIDE DEFAULT OBJECTIVES`);
      } else {
        console.log('📋 No active custom objectives, will use preset objectives');
      }
    } catch (error) {
      console.log('⚠️  Error checking custom objectives:', error);
    }

    // Step 3: Build Enhanced System Prompt
    console.log('\n📝 Building Enhanced System Prompt...');

    // Read base system prompt
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Enhanced identity section
    const identitySection = `\n\n## AGENT IDENTITY\nYou are ${agentName}, ${agentPersonality || 'a friendly and knowledgeable assistant'}.\nGreeting: "${agentGreeting || 'Hello! How can I help you with the demo today?'}"\n`;

    // Step 3a: Get video context from Twelve Labs (if available)
    console.log('\n🎬 Fetching Video Context from Twelve Labs...');
    let videoContextSection = '';
    try {
      const { data: demoVideos } = await supabase
        .from('demo_videos')
        .select('title, metadata')
        .eq('demo_id', demoId)
        .order('order_index', { ascending: true });

      if (demoVideos && demoVideos.length > 0) {
        const indexedVideos = demoVideos.filter((v) => v.metadata?.twelvelabs?.generatedContext);

        if (indexedVideos.length > 0) {
          console.log(`✅ Found ${indexedVideos.length} videos with AI context`);
          videoContextSection = `\n\n## VIDEO CONTENT AWARENESS\nYou have detailed knowledge of the following demo videos. Use this to provide accurate timestamps and descriptions when users ask about specific content.\n\n`;

          for (const video of indexedVideos) {
            const context = video.metadata.twelvelabs.generatedContext;
            videoContextSection += `### ${video.title}\n${context}\n\n`;
          }

          videoContextSection += `**IMPORTANT**: When users ask about video content, you can now reference specific timestamps and what happens at each point. Guide users to the most relevant sections.\n`;
        } else {
          console.log('⚠️  Videos exist but no Twelve Labs context generated yet');
        }
      }
    } catch (error) {
      console.log('⚠️  Error fetching video context:', error);
    }

    // Enhanced but concise objectives section
    let objectivesSection = '';
    
    if (activeCustomObjective && activeCustomObjective.objectives.length > 0) {
      console.log(`📋 Using custom objectives: ${activeCustomObjective.name}`);
      objectivesSection = `\n\n## DEMO OBJECTIVES\n### ${activeCustomObjective.name}\n`;
      objectivesSection += `Follow this structured flow:\n`;
      
      activeCustomObjective.objectives.forEach((obj, i) => {
        objectivesSection += `${i + 1}. **${obj.objective_name}**: ${obj.objective_prompt.substring(0, 100)}...\n`;
      });
      
      objectivesSection += `\nCapture key data points and guide users through each step naturally.\n`;
    } else {
      console.log(`📋 Using default objectives`);
      objectivesSection = `\n\n## DEMO OBJECTIVES\n1. Welcome users and understand their specific needs\n2. Show relevant product videos based on their interests\n3. Answer detailed questions using your knowledge base\n4. Guide qualified prospects toward trial signup\n`;
    }

    // Language handling section
    const languageSection = `\n\n## LANGUAGE SUPPORT\nAutomatically detect and respond in the user's language while keeping all tool calls (fetch_video, show_trial_cta) in English with exact titles.\n`;

    // Build enhanced system prompt
    const enhancedSystemPrompt = baseSystemPrompt + identitySection + objectivesSection + videoContextSection + languageSection;

    console.log(`✅ Enhanced system prompt built (${enhancedSystemPrompt.length} characters)`);

    // Step 4: Always Create New Persona
    console.log('\n🎭 Creating New Persona...');
    
    const GUARDRAILS_ID = process.env.DOMO_AI_GUARDRAILS_ID || 'g178c7c5e032b';
    const DEFAULT_OBJECTIVES_ID = process.env.DOMO_AI_OBJECTIVES_ID || 'o4f2d4eb9b217';
    
    console.log('🔧 Using Configuration:');
    console.log(`   Guardrails ID: ${GUARDRAILS_ID}`);
    console.log(`   Default Objectives ID: ${DEFAULT_OBJECTIVES_ID}`);
    
    let persona: { persona_id: string };
    let objectivesId: string;
    
    // Determine which objectives to use - CUSTOM OBJECTIVES ALWAYS OVERRIDE DEFAULTS
    if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
      console.log(`🎯 USING CUSTOM OBJECTIVES (overriding defaults): ${activeCustomObjective.name}`);
      console.log(`   Custom Objectives ID: ${activeCustomObjective.tavus_objectives_id}`);
      console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
      console.log(`   ✅ Custom objectives will override any default templates`);
      objectivesId = activeCustomObjective.tavus_objectives_id;
    } else if (activeCustomObjective && !activeCustomObjective.tavus_objectives_id) {
      console.log(`🔄 CREATING NEW TAVUS OBJECTIVES for custom objective: ${activeCustomObjective.name}`);
      console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
      console.log(`   Will create with webhook URLs`);
      
      // Create new objectives in Tavus with webhook URLs
      try {
        const { syncCustomObjectiveWithTavus } = await import('@/lib/tavus/custom-objectives-integration');
        const newObjectivesId = await syncCustomObjectiveWithTavus(activeCustomObjective.id);
        
        if (newObjectivesId) {
          console.log(`✅ Created new Tavus objectives: ${newObjectivesId}`);
          objectivesId = newObjectivesId;
        } else {
          console.log(`❌ Failed to create new objectives - falling back to defaults`);
          objectivesId = DEFAULT_OBJECTIVES_ID;
        }
      } catch (error) {
        console.log(`❌ Error creating new objectives: ${error}`);
        objectivesId = DEFAULT_OBJECTIVES_ID;
      }
    } else {
      console.log(`📋 No custom objectives found - using default template objectives`);
      console.log(`   Default Objectives ID: ${DEFAULT_OBJECTIVES_ID}`);
      objectivesId = DEFAULT_OBJECTIVES_ID;
    }
    
    // Always create a new persona
    try {
      // Debug environment variables
      console.log('🔍 Environment Variables Check:');
      console.log(`   TAVUS_BASE_URL: ${process.env.TAVUS_BASE_URL || 'NOT SET'}`);
      console.log(`   TAVUS_API_KEY: ${process.env.TAVUS_API_KEY ? 'SET (' + process.env.TAVUS_API_KEY.length + ' chars)' : 'NOT SET'}`);
      console.log(`   TAVUS_REPLICA_ID: ${process.env.TAVUS_REPLICA_ID || 'NOT SET'}`);
      console.log(`   GUARDRAILS_ID: ${GUARDRAILS_ID}`);
      console.log(`   OBJECTIVES_ID: ${objectivesId}`);

      // Check if system prompt is too long and truncate if necessary
      let finalSystemPrompt = enhancedSystemPrompt;
      const MAX_PROMPT_LENGTH = 8000; // Conservative limit
      const TRUNCATION_SUFFIX = '\n\n[Truncated for length]';
      
      if (enhancedSystemPrompt.length > MAX_PROMPT_LENGTH) {
        console.warn(`⚠️ System prompt is too long (${enhancedSystemPrompt.length} chars). Truncating to ${MAX_PROMPT_LENGTH} chars.`);
        finalSystemPrompt = enhancedSystemPrompt.substring(0, MAX_PROMPT_LENGTH - TRUNCATION_SUFFIX.length) + TRUNCATION_SUFFIX;
      }

      // Create persona payload with all fields
      const personaPayload: any = {
        persona_name: `${agentName} - ${demo.name} (${new Date().toISOString().split('T')[0]})`,
        system_prompt: finalSystemPrompt,
        objectives_id: objectivesId,
        guardrails_id: GUARDRAILS_ID,
      };

      // Add optional fields only if they exist
      if (process.env.TAVUS_REPLICA_ID) {
        personaPayload.default_replica_id = process.env.TAVUS_REPLICA_ID;
      }

      console.log('🎭 Creating persona with full configuration...');
      console.log('📡 Creating new Tavus persona...');
      console.log(`   Name: ${personaPayload.persona_name}`);
      console.log(`   System Prompt Length: ${finalSystemPrompt.length} chars`);
      
      // Log payload without the full system prompt to avoid cluttering logs
      const logPayload = { ...personaPayload };
      logPayload.system_prompt = `[${finalSystemPrompt.length} characters]`;
      console.log(`   Payload:`, JSON.stringify(logPayload, null, 2));
      
      const apiUrl = `${process.env.TAVUS_BASE_URL}/personas`;
      console.log(`   API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TAVUS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaPayload),
      });

      console.log(`📡 Tavus API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to create new persona:', errorText);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to parse as JSON first, then fall back to text
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = errorText.substring(0, 500); // Limit error text length
        }
        
        // If it's a 500 error with HTML, it might be a custom objectives issue
        if (response.status === 500 && typeof errorDetails === 'string' && errorDetails.includes('<!doctype html>')) {
          console.error('❌ Received HTML error page, likely custom objectives issue');
          
          // Try with default objectives ID instead of custom one
          if (activeCustomObjective && objectivesId !== DEFAULT_OBJECTIVES_ID) {
            console.log('🔄 Retrying with default objectives ID...');
            const fallbackPayload = {
              ...personaPayload,
              objectives_id: DEFAULT_OBJECTIVES_ID,
              persona_name: personaPayload.persona_name + ' (Fallback)'
            };
            
            const fallbackResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'x-api-key': process.env.TAVUS_API_KEY!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fallbackPayload),
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              persona = { persona_id: fallbackData.persona_id };
              objectivesId = DEFAULT_OBJECTIVES_ID; // Update for response
              console.log(`✅ Created persona with default objectives: ${fallbackData.persona_id}`);
              console.log(`⚠️  Note: Custom objectives ID ${activeCustomObjective.tavus_objectives_id} appears to be invalid in Tavus`);
            } else {
              // Try with simplified system prompt as last resort
              console.log('🔄 Retrying with simplified system prompt...');
              const simplePayload: any = {
                persona_name: personaPayload.persona_name + ' (Simple)',
                system_prompt: baseSystemPrompt + identitySection, // Just base + identity, no objectives
                objectives_id: DEFAULT_OBJECTIVES_ID,
                guardrails_id: GUARDRAILS_ID,
              };
              
              if (process.env.TAVUS_REPLICA_ID) {
                simplePayload.default_replica_id = process.env.TAVUS_REPLICA_ID;
              }
              
              const retryResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'x-api-key': process.env.TAVUS_API_KEY!,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(simplePayload),
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                persona = { persona_id: retryData.persona_id };
                objectivesId = DEFAULT_OBJECTIVES_ID; // Update for response
                console.log(`✅ Created persona with simplified prompt: ${retryData.persona_id}`);
              } else {
                const retryError = await retryResponse.text();
                console.error('❌ All retry attempts failed:', retryError);
                
                return NextResponse.json({
                  success: false,
                  error: 'Failed to create Tavus persona',
                  details: {
                    status: response.status,
                    statusText: response.statusText,
                    error: 'Custom objectives may be invalid or system prompt too complex',
                    suggestion: 'Try recreating your custom objectives or contact support.'
                  }
                }, { status: 500 });
              }
            }
          } else {
            // Already using default objectives, try simplified prompt
            console.log('🔄 Retrying with simplified system prompt...');
            const simplePayload: any = {
              persona_name: personaPayload.persona_name + ' (Simple)',
              system_prompt: baseSystemPrompt + identitySection, // Just base + identity, no objectives
              objectives_id: objectivesId,
              guardrails_id: GUARDRAILS_ID,
            };
            
            if (process.env.TAVUS_REPLICA_ID) {
              simplePayload.default_replica_id = process.env.TAVUS_REPLICA_ID;
            }
            
            const retryResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'x-api-key': process.env.TAVUS_API_KEY!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(simplePayload),
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              persona = { persona_id: retryData.persona_id };
              console.log(`✅ Created persona with simplified prompt: ${retryData.persona_id}`);
            } else {
              const retryError = await retryResponse.text();
              console.error('❌ Retry also failed:', retryError);
              
              return NextResponse.json({
                success: false,
                error: 'Failed to create Tavus persona',
                details: {
                  status: response.status,
                  statusText: response.statusText,
                  error: 'System prompt may be too complex or contain invalid characters',
                  suggestion: 'Try with a simpler agent configuration or contact support.'
                }
              }, { status: 500 });
            }
          }
        } else {
          // Return a more user-friendly error
          return NextResponse.json({
            success: false,
            error: 'Failed to create Tavus persona',
            details: {
              status: response.status,
              statusText: response.statusText,
              error: errorDetails,
              suggestion: 'This might be a temporary Tavus API issue. Please try again in a moment.'
            }
          }, { status: 500 });
        }
      } else {
        const personaData = await response.json();
        persona = { persona_id: personaData.persona_id };
        console.log(`✅ Created new persona: ${personaData.persona_id}`);
      }
      
    } catch (error) {
      console.error('❌ Error creating new persona:', error);
      throw error; // Don't fallback, let the user know it failed
    }

    console.log(`Final Configuration:`);
    console.log(`   Persona ID: ${persona.persona_id}`);
    console.log(`   Guardrails ID: ${GUARDRAILS_ID}`);
    console.log(`   Objectives ID: ${objectivesId}`);

    // Step 5: Update Demo with Agent Configuration
    console.log('\n📊 Updating Demo Configuration...');
    
    const { error: updateError } = await supabase
      .from('demos')
      .update({
        tavus_persona_id: persona.persona_id,
        agent_name: agentName,
        agent_personality: agentPersonality,
        agent_greeting: agentGreeting,
        metadata: {
          ...demo.metadata,
          agentName,
          agentPersonality,
          agentGreeting,
          tavusPersonaId: persona.persona_id,
          agentCreatedAt: new Date().toISOString(),
          hasCustomObjectives: !!activeCustomObjective,
          customObjectivesId: activeCustomObjective?.id || null,
          guardrailsId: GUARDRAILS_ID,
          objectivesId: objectivesId
        }
      })
      .eq('id', demoId);

    if (updateError) {
      console.error('❌ Demo update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update demo configuration' }, { status: 500 });
    }

    console.log('✅ Demo updated with agent configuration');
    console.log(`   Database now has tavus_persona_id: ${persona.persona_id}`);
    
    // Verify the update worked
    const { data: updatedDemo, error: verifyError } = await supabase
      .from('demos')
      .select('tavus_persona_id')
      .eq('id', demoId)
      .single();
    
    if (verifyError) {
      console.error('⚠️  Could not verify demo update:', verifyError);
    } else {
      console.log(`✅ Verified: Demo ${demoId} now has persona ${updatedDemo.tavus_persona_id}`);
    }

    // Step 6: Success Response
    console.log('\n' + '='.repeat(50));
    console.log('🎉 AGENT CONFIGURED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`Agent Name: ${agentName}`);
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Guardrails: ${GUARDRAILS_ID}`);
    console.log(`Active Objectives: ${objectivesId}`);
    
    if (activeCustomObjective) {
      console.log(`✅ NEW PERSONA CREATED with custom objectives: ${activeCustomObjective.name}`);
      console.log(`   Custom Objectives: ${activeCustomObjective.objectives.length} steps`);
      console.log(`   Persona has the actual custom objectives baked in`);
    } else {
      console.log(`✅ NEW PERSONA CREATED with default objectives`);
      console.log(`   Default Objectives: ${DEFAULT_OBJECTIVES_ID}`);
    }

    return NextResponse.json({
      success: true,
      agentId: persona.persona_id,
      personaId: persona.persona_id,
      demoId,
      configuration: {
        systemPrompt: true,
        guardrails: GUARDRAILS_ID,
        presetObjectives: DEFAULT_OBJECTIVES_ID,
        activeObjectives: objectivesId,
        customObjectives: activeCustomObjective ? {
          id: activeCustomObjective.id,
          name: activeCustomObjective.name,
          steps: activeCustomObjective.objectives.length,
          tavusId: activeCustomObjective.tavus_objectives_id
        } : null,
        enhancedSystemPrompt: enhancedSystemPrompt.length
      },
      message: activeCustomObjective
        ? `New persona created with custom objectives: ${activeCustomObjective.name}`
        : 'New persona created with default objectives',
      personaType: 'new'
    });

  } catch (error: unknown) {
    logError(error, 'Enhanced Agent Creation Error');
    const message = getErrorMessage(error);
    console.error('❌ Enhanced agent creation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/create-enhanced-agent',
});