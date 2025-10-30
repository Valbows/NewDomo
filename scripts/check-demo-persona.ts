#!/usr/bin/env tsx
/**
 * Check Demo Persona Configuration
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

async function checkDemoPersona() {
  console.log('🔍 Checking Demo Persona Configuration\n');

  try {
    // Check demo configuration
    console.log('📡 Fetching demo data...');
    const response = await fetch(`http://localhost:3000/api/admin/debug/conversation-data?demoId=${DEMO_ID}`);
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Demo data received');

    // Extract persona information
    const demo = data.demo;
    if (demo) {
      console.log('\n🎭 PERSONA INFORMATION:');
      console.log(`   Demo ID: ${demo.id}`);
      console.log(`   Demo Name: ${demo.name}`);
      console.log(`   Tavus Persona ID: ${demo.tavus_persona_id || 'Not set'}`);
      console.log(`   Agent Name: ${demo.agent_name || demo.metadata?.agentName || 'Not set'}`);
      console.log(`   Agent Personality: ${demo.agent_personality || demo.metadata?.agentPersonality || 'Not set'}`);
      console.log(`   Agent Greeting: ${demo.agent_greeting || demo.metadata?.agentGreeting || 'Not set'}`);

      // Check if persona exists in Tavus
      if (demo.tavus_persona_id) {
        console.log('\n🔗 TAVUS PERSONA STATUS:');
        console.log(`   Persona ID: ${demo.tavus_persona_id}`);
        console.log(`   Status: ${demo.tavus_persona_id ? 'Configured' : 'Not configured'}`);
      }

      return demo.tavus_persona_id;
    } else {
      console.log('❌ No demo data found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  checkDemoPersona();
}