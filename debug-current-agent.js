#!/usr/bin/env node

/**
 * Debug the current agent configuration to see if tools are properly set up
 */

require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('🔍 Debugging current agent configuration...\n');
  
  const personaId = process.env.COMPLETE_PERSONA_ID;
  const apiKey = process.env.TAVUS_API_KEY;
  
  if (!personaId || !apiKey) {
    console.log('❌ Missing COMPLETE_PERSONA_ID or TAVUS_API_KEY in environment');
    return;
  }
  
  try {
    console.log(`📋 Checking persona: ${personaId}`);
    
    // Get persona details from Tavus
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get persona: ${response.status} ${errorText}`);
    }
    
    const persona = await response.json();
    
    console.log('✅ Persona found');
    console.log(`   Name: ${persona.name || 'unnamed'}`);
    console.log(`   Created: ${persona.created_at}`);
    
    // Check if tools are configured (check multiple possible locations)
    const tools = persona.tools || persona.layers?.llm?.tools || [];
    console.log('🔍 Raw persona data keys:', Object.keys(persona));
    console.log('🔍 Layers data:', persona.layers ? Object.keys(persona.layers) : 'none');
    if (persona.layers?.llm) {
      console.log('🔍 LLM layer keys:', Object.keys(persona.layers.llm));
    }
    
    if (tools && tools.length > 0) {
      console.log(`\n🔧 Tools configured: ${tools.length} tools`);
      
      tools.forEach((tool, index) => {
        console.log(`\n   Tool ${index + 1}: ${tool.function?.name || 'unknown'}`);
        console.log(`   Description: ${tool.function?.description || 'none'}`);
        
        if (tool.function?.name === 'fetch_video') {
          const titleEnum = tool.function?.parameters?.properties?.title?.enum;
          if (titleEnum && titleEnum.length > 0) {
            console.log(`   📊 Available video titles (${titleEnum.length}):`);
            titleEnum.forEach((title, i) => {
              console.log(`      ${i + 1}. "${title}"`);
            });
          } else {
            console.log('   ⚠️ No video titles in enum');
          }
        }
      });
    } else {
      console.log('\n❌ No tools configured for this persona');
      console.log('   This explains why fetch_video is not working!');
    }
    
    // Check system prompt
    if (persona.system_prompt) {
      const hasToolInstructions = persona.system_prompt.includes('fetch_video');
      const hasToolUsage = persona.system_prompt.includes('TOOL USAGE');
      
      console.log('\n📝 System prompt analysis:');
      console.log(`   Contains fetch_video: ${hasToolInstructions ? '✅' : '❌'}`);
      console.log(`   Contains tool usage instructions: ${hasToolUsage ? '✅' : '❌'}`);
      console.log(`   Length: ${persona.system_prompt.length} characters`);
    }
    
    console.log('\n🎯 Diagnosis:');
    if (!tools || tools.length === 0) {
      console.log('   ❌ PROBLEM: No tools configured');
      console.log('   💡 SOLUTION: Create a new agent with TAVUS_TOOLS_ENABLED=true');
    } else {
      const fetchVideoTool = tools.find(t => t.function?.name === 'fetch_video');
      if (!fetchVideoTool) {
        console.log('   ❌ PROBLEM: fetch_video tool not found');
      } else {
        const hasEnum = fetchVideoTool.function?.parameters?.properties?.title?.enum;
        if (!hasEnum || hasEnum.length === 0) {
          console.log('   ❌ PROBLEM: fetch_video tool has no video titles');
        } else {
          console.log('   ✅ Tools are properly configured');
          console.log('   💡 Issue might be AI not using tools properly');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();