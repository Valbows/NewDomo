/**
 * Browser Console Test for Enhanced Agent Creation
 * Run this in your browser console on the demo configure page
 */

async function testEnhancedAgentCreation() {
  console.log('🤖 TESTING ENHANCED AGENT CREATION');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Check custom objectives status
    console.log('🎯 Step 1: Checking Custom Objectives...');
    const objResponse = await fetch('/api/admin/test/custom-objectives-backend');
    const objData = await objResponse.json();
    
    if (objData.success && objData.activeObjective) {
      console.log(`✅ Active custom objective: ${objData.activeObjective.name}`);
      console.log(`   Steps: ${objData.activeObjective.steps}`);
      console.log(`   Tavus ID: ${objData.activeObjective.tavus_objectives_id}`);
    } else {
      console.log('📋 No active custom objectives - will use preset objectives');
    }
    
    // Step 2: Create enhanced agent
    console.log('\n🚀 Step 2: Creating Enhanced Agent...');
    const response = await fetch('/api/demos/agents/create-enhanced', {
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
    
    console.log('\n🎉 SUCCESS! Enhanced Agent Created');
    console.log('='.repeat(50));
    console.log(`Agent ID: ${result.agentId}`);
    console.log(`Persona ID: ${result.personaId}`);
    
    console.log('\n📋 Configuration:');
    console.log(`   ✅ System Prompt: Included`);
    console.log(`   ✅ Guardrails: ${result.configuration.guardrails}`);
    console.log(`   ✅ Objectives: ${result.configuration.objectives}`);
    
    if (result.configuration.customObjectives) {
      console.log(`   ✅ Custom Objectives: ${result.configuration.customObjectives.name} (${result.configuration.customObjectives.steps} steps)`);
    } else {
      console.log(`   ✅ Preset Objectives: Using default/simple objectives`);
    }
    
    console.log('\n🚀 Test Your Agent:');
    console.log('   1. Go to the Experience tab');
    console.log('   2. Start a new conversation');
    
    if (result.configuration.customObjectives) {
      console.log('   3. Agent should say: "Hi I\'m Domo, your AI sales engineer..."');
      console.log('   4. Follow your custom Workday demo flow');
    } else {
      console.log('   3. Agent should follow preset objectives');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Instructions
console.log('🧪 Enhanced Agent Creation Test Ready!');
console.log('Run: testEnhancedAgentCreation()');

// Auto-run if you want
// testEnhancedAgentCreation();