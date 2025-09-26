#!/usr/bin/env npx tsx
/**
 * Direct test of Tavus persona configuration (no auth required)
 */

async function testTavusPersonaDirect() {
  console.log('🧪 Testing Tavus Persona Configuration (Direct API)');
  console.log('='.repeat(60));

  const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
  if (!TAVUS_API_KEY) {
    console.log('❌ TAVUS_API_KEY environment variable not found');
    console.log('💡 Make sure your .env.local file has TAVUS_API_KEY set');
    return;
  }

  console.log('✅ Tavus API Key found');
  console.log(`   Key length: ${TAVUS_API_KEY.length} characters`);
  console.log(`   Key prefix: ${TAVUS_API_KEY.substring(0, 8)}...`);
  console.log('');

  // Test 1: List all personas
  console.log('1️⃣ Fetching all personas...');
  try {
    const response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📋 Raw response:', JSON.stringify(data, null, 2));
      
      const personas = Array.isArray(data) ? data : data.data || [];
      console.log(`✅ Found ${personas.length} personas`);
      
      personas.forEach((persona: any, index: number) => {
        console.log(`   ${index + 1}. ${persona.persona_name || 'Unnamed'} (${persona.persona_id})`);
        console.log(`      Created: ${persona.created_at || 'Unknown'}`);
        console.log(`      Guardrails: ${persona.guardrails_id || 'Not set'}`);
        console.log(`      Objectives: ${persona.objectives_id || 'Not set'}`);
        console.log(`      Perception Model: ${persona.perception_model || 'Not set'}`);
        console.log(`      Default Replica: ${persona.default_replica_id || 'Not set'}`);
        console.log('');
      });

      // Test the most recent persona in detail
      if (personas.length > 0) {
        const latestPersona = personas[personas.length - 1];
        console.log('🔍 Testing latest persona in detail...');
        console.log(`   Persona ID: ${latestPersona.persona_id}`);
        
        // Check if this persona has guardrails
        if (latestPersona.guardrails_id) {
          console.log('2️⃣ Checking guardrails...');
          try {
            const guardrailsResponse = await fetch(`https://tavusapi.com/v2/guardrails/${latestPersona.guardrails_id}`, {
              method: 'GET',
              headers: {
                'x-api-key': TAVUS_API_KEY,
              },
            });
            
            if (guardrailsResponse.ok) {
              const guardrails = await guardrailsResponse.json();
              console.log('✅ Guardrails found:');
              console.log(`   Name: ${guardrails.name || 'Unnamed'}`);
              console.log(`   Rules: ${guardrails.rules?.length || 0} rules`);
              if (guardrails.rules) {
                guardrails.rules.forEach((rule: any, i: number) => {
                  console.log(`      ${i + 1}. ${rule.rule_name}: ${rule.rule_description?.substring(0, 100)}...`);
                });
              }
            } else {
              console.log('❌ Failed to fetch guardrails');
            }
          } catch (error) {
            console.log('❌ Error fetching guardrails:', error);
          }
        } else {
          console.log('⚠️ No guardrails configured for this persona');
        }

        // Check if this persona has objectives
        if (latestPersona.objectives_id) {
          console.log('3️⃣ Checking objectives...');
          try {
            const objectivesResponse = await fetch(`https://tavusapi.com/v2/objectives/${latestPersona.objectives_id}`, {
              method: 'GET',
              headers: {
                'x-api-key': TAVUS_API_KEY,
              },
            });
            
            if (objectivesResponse.ok) {
              const objectives = await objectivesResponse.json();
              console.log('✅ Objectives found:');
              console.log(`   Name: ${objectives.name || 'Unnamed'}`);
              console.log(`   Steps: ${objectives.objectives?.length || 0} objectives`);
              if (objectives.objectives) {
                objectives.objectives.forEach((obj: any, i: number) => {
                  console.log(`      ${i + 1}. ${obj.objective_name}`);
                  console.log(`         Mode: ${obj.confirmation_mode}`);
                  console.log(`         Variables: ${obj.output_variables?.join(', ') || 'None'}`);
                });
              }
            } else {
              console.log('❌ Failed to fetch objectives');
            }
          } catch (error) {
            console.log('❌ Error fetching objectives:', error);
          }
        } else {
          console.log('⚠️ No custom objectives configured for this persona');
        }

        // Summary
        console.log('📊 PERSONA CONFIGURATION SUMMARY');
        console.log('='.repeat(40));
        console.log(`Persona: ${latestPersona.persona_name || 'Unnamed'}`);
        console.log(`ID: ${latestPersona.persona_id}`);
        console.log(`Guardrails: ${latestPersona.guardrails_id ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`Objectives: ${latestPersona.objectives_id ? '✅ Configured' : '❌ Using defaults'}`);
        console.log(`Perception Analysis: ${latestPersona.perception_model === 'raven-0' ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Default Replica: ${latestPersona.default_replica_id ? '✅ Set' : '❌ Not set'}`);
        console.log(`System Prompt: ${latestPersona.system_prompt ? `✅ ${latestPersona.system_prompt.length} chars` : '❌ Not set'}`);
      }
    } else {
      console.log('❌ Failed to fetch personas');
      console.log(`   Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Error fetching personas:', error);
  }

  console.log('');
  console.log('🎯 Direct Tavus API Test Complete!');
}

// Run the test
testTavusPersonaDirect().catch(console.error);