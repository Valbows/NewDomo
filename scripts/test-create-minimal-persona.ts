#!/usr/bin/env npx tsx
/**
 * Test creating a minimal persona to isolate the issue
 */

async function testCreateMinimalPersona() {
  console.log('🧪 Testing Minimal Persona Creation');
  console.log('='.repeat(50));

  const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '42c5bd6766bd4da39d43ac8dc759e32d';
  const TAVUS_BASE_URL = process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2';

  console.log('Environment:');
  console.log(`   API Key: ${TAVUS_API_KEY.substring(0, 8)}...`);
  console.log(`   Base URL: ${TAVUS_BASE_URL}`);

  // Test 1: Create minimal persona (just name and system prompt)
  console.log('\n1️⃣ Testing minimal persona creation...');
  
  const minimalPayload = {
    persona_name: `Test Minimal Agent - ${new Date().toISOString().split('T')[0]}`,
    system_prompt: 'You are a helpful assistant for product demos. Be friendly and professional.',
  };

  try {
    console.log('Payload:', JSON.stringify(minimalPayload, null, 2));
    
    const response = await fetch(`${TAVUS_BASE_URL}/personas`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalPayload),
    });

    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Minimal persona created successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return result.persona_id;
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create minimal persona');
      console.log('Error:', errorText.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating minimal persona:', error);
    return null;
  }
}

// Test 2: Create persona with replica ID
async function testCreatePersonaWithReplica() {
  console.log('\n2️⃣ Testing persona creation with replica ID...');
  
  const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '42c5bd6766bd4da39d43ac8dc759e32d';
  const TAVUS_BASE_URL = process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2';
  const REPLICA_ID = process.env.TAVUS_REPLICA_ID || 'rf4703150052';

  const payloadWithReplica = {
    persona_name: `Test Replica Agent - ${new Date().toISOString().split('T')[0]}`,
    system_prompt: 'You are a helpful assistant for product demos. Be friendly and professional.',
    default_replica_id: REPLICA_ID,
  };

  try {
    console.log('Payload:', JSON.stringify(payloadWithReplica, null, 2));
    
    const response = await fetch(`${TAVUS_BASE_URL}/personas`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadWithReplica),
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Persona with replica created successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return result.persona_id;
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create persona with replica');
      console.log('Error:', errorText.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating persona with replica:', error);
    return null;
  }
}

// Test 3: Create persona with guardrails and objectives
async function testCreatePersonaWithGuardrailsAndObjectives() {
  console.log('\n3️⃣ Testing persona creation with guardrails and objectives...');
  
  const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '42c5bd6766bd4da39d43ac8dc759e32d';
  const TAVUS_BASE_URL = process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2';
  const REPLICA_ID = process.env.TAVUS_REPLICA_ID || 'rf4703150052';
  const GUARDRAILS_ID = 'g9f1b6384a155';
  const OBJECTIVES_ID = 'oed2cab8441a6';

  const fullPayload = {
    persona_name: `Test Full Agent - ${new Date().toISOString().split('T')[0]}`,
    system_prompt: 'You are a helpful assistant for product demos. Be friendly and professional.',
    default_replica_id: REPLICA_ID,
    guardrails_id: GUARDRAILS_ID,
    objectives_id: OBJECTIVES_ID,
  };

  try {
    console.log('Payload:', JSON.stringify(fullPayload, null, 2));
    
    const response = await fetch(`${TAVUS_BASE_URL}/personas`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload),
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Full persona created successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return result.persona_id;
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create full persona');
      console.log('Error:', errorText.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating full persona:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  const minimalId = await testCreateMinimalPersona();
  const replicaId = await testCreatePersonaWithReplica();
  const fullId = await testCreatePersonaWithGuardrailsAndObjectives();

  console.log('\n🎯 Test Results Summary:');
  console.log(`   Minimal Persona: ${minimalId ? '✅ ' + minimalId : '❌ Failed'}`);
  console.log(`   With Replica: ${replicaId ? '✅ ' + replicaId : '❌ Failed'}`);
  console.log(`   Full Configuration: ${fullId ? '✅ ' + fullId : '❌ Failed'}`);

  if (minimalId || replicaId || fullId) {
    console.log('\n✅ At least one persona creation method works!');
  } else {
    console.log('\n❌ All persona creation methods failed - there might be an issue with the Tavus API or credentials');
  }
}

runAllTests().catch(console.error);