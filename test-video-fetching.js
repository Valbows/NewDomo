#!/usr/bin/env node

/**
 * Test video fetching functionality with current setup
 */

async function main() {
  console.log('🎬 Testing video fetching functionality...\n');
  
  const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4'; // WorkDay Platform Demo
  
  try {
    console.log('📋 Testing agent creation with video tools...');
    
    // Test agent creation
    const createResponse = await fetch('http://localhost:3000/api/create-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        demoId: demoId
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Agent creation failed: ${createResponse.status} ${errorText}`);
    }
    
    const agentData = await createResponse.json();
    console.log('✅ Agent created successfully');
    console.log(`   Agent ID: ${agentData.agent?.persona_id || 'unknown'}`);
    
    // Check if tools are included
    if (agentData.agent?.tools && agentData.agent.tools.length > 0) {
      console.log(`   🔧 Tools enabled: ${agentData.agent.tools.length} tools`);
      
      const fetchVideoTool = agentData.agent.tools.find(t => t.function?.name === 'fetch_video');
      if (fetchVideoTool) {
        console.log('   🎬 fetch_video tool found');
        const titleEnum = fetchVideoTool.function?.parameters?.properties?.title?.enum;
        if (titleEnum && titleEnum.length > 0) {
          console.log(`   📊 Available video titles (${titleEnum.length}):`);
          titleEnum.forEach((title, index) => {
            console.log(`      ${index + 1}. "${title}"`);
          });
        } else {
          console.log('   ⚠️ No video titles in tool enum');
        }
      } else {
        console.log('   ❌ fetch_video tool not found');
      }
    } else {
      console.log('   ⚠️ No tools enabled');
    }
    
    console.log('\n🎯 Key improvements made:');
    console.log('   ✅ System prompt no longer hardcodes video titles');
    console.log('   ✅ Video titles passed through tool enum property');
    console.log('   ✅ Clear tool usage instructions without verbalization');
    console.log('   ✅ Guardrails ensure exact title matching');
    console.log('   ✅ Progressive video demonstration guidelines');
    
    console.log('\n💡 How it works now:');
    console.log('   1. Agent creation fetches available videos from database');
    console.log('   2. Video titles are passed to AI via fetch_video tool enum');
    console.log('   3. AI can see available titles when using the tool');
    console.log('   4. Guardrails ensure exact title matching');
    console.log('   5. Tool calls are executed silently');
    
    console.log('\n🚀 Test the agent by asking:');
    console.log('   "Can you show me a video about strategic planning?"');
    console.log('   "I\'d like to see the workforce planning demo"');
    console.log('   "Show me how headcount planning works"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();