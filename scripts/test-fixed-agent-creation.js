/**
 * Test Fixed Agent Creation
 * Run this in browser console to test the improved agent creation
 */

async function testFixedAgentCreation() {
  console.log('🧪 TESTING FIXED AGENT CREATION');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check custom objectives status
    console.log('🎯 Step 1: Checking Custom Objectives...');
    const objResponse = await fetch('/api/test-custom-objectives-backend');
    const objData = await objResponse.json();
    
    if (objData.success && objData.activeObjective) {
      console.log(`✅ Active custom objective: ${objData.activeObjective.name}`);
      console.log(`   Steps: ${objData.activeObjective.steps}`);
      console.log(`   Tavus ID: ${objData.activeObjective.tavus_objectives_id}`);
    } else {
      console.log('📋 No active custom objectives - will use preset objectives');
    }
    
    // Step 2: Create enhanced agent with fixed API
    console.log('\n🤖 Step 2: Creating Agent with Fixed API...');
    const response = await fetch('/api/create-enhanced-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        demoId: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
        agentName: 'Domo',
        agentPersonality: 'Friendly and professional AI sales engineer with deep product knowledge',
        agentGreeting: 'Hello! I\'m Domo, your AI sales engineer. How can I help you with the demo today?'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed:', response.status, error);
      return;
    }

    const result = await response.json();
    
    console.log('\n🎉 SUCCESS! Fixed Agent Created');
    console.log('='.repeat(60));
    console.log(`Agent ID: ${result.agentId}`);
    console.log(`Persona ID: ${result.personaId}`);
    
    console.log('\n📋 Configuration:');
    console.log(`   ✅ System Prompt: Included`);
    console.log(`   ✅ Guardrails: ${result.configuration.guardrails}`);
    console.log(`   ✅ Preset Objectives: ${result.configuration.presetObjectives}`);
    console.log(`   ✅ Active Objectives: ${result.configuration.activeObjectives}`);
    
    if (result.configuration.customObjectives) {
      console.log(`   ✅ Custom Objectives: ${result.configuration.customObjectives.name}`);
      console.log(`      - Steps: ${result.configuration.customObjectives.steps}`);
      console.log(`      - Tavus ID: ${result.configuration.customObjectives.tavusId}`);
      console.log(`   📋 Integration: Custom + Preset objectives combined`);
    } else {
      console.log(`   📋 Using: Preset objectives only`);
    }
    
    console.log('\n🔍 Verification:');
    console.log(`   ${result.configuration.guardrails ? '✅' : '❌'} Guardrails configured`);
    console.log(`   ${result.configuration.activeObjectives ? '✅' : '❌'} Objectives configured`);
    console.log(`   ${result.configuration.systemPrompt ? '✅' : '❌'} System prompt included`);
    
    console.log('\n🚀 Test Your Agent:');
    console.log('1. Go to /demos/bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b/experience');
    console.log('2. Start a new conversation');
    
    if (result.configuration.customObjectives) {
      console.log('3. Agent should say: "Hi I\'m Domo, your AI sales engineer..."');
      console.log('4. Follow your custom Workday demo flow');
      console.log('5. Also maintain preset objective principles');
    } else {
      console.log('3. Agent should follow preset objectives');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions
console.log('🧪 Fixed Agent Creation Test Ready!');
console.log('Run: testFixedAgentCreation()');

// Auto-run if you want
// testFixedAgentCreation();