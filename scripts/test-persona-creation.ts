#!/usr/bin/env tsx

/**
 * Test script to see what fields are supported in persona creation
 */

async function testPersonaCreation() {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🧪 Testing persona creation with minimal payload...');

  try {
    // Test 1: Minimal persona
    const minimalPayload = {
      persona_name: 'Test Raven Persona',
      system_prompt: 'You are a test assistant.',
      pipeline_mode: 'full'
    };

    console.log('📋 Testing minimal payload...');
    let response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(minimalPayload),
    });

    if (response.ok) {
      const persona = await response.json();
      console.log('✅ Minimal persona created:', persona.persona_id);
      console.log('📋 Response fields:', Object.keys(persona));
      
      // Clean up
      await fetch(`https://tavusapi.com/v2/personas/${persona.persona_id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
    } else {
      const error = await response.text();
      console.log('❌ Minimal failed:', response.status, error);
    }

    // Test 2: With perception_model
    console.log('\n📋 Testing with perception_model...');
    const ravenPayload = {
      ...minimalPayload,
      persona_name: 'Test Raven Persona 2',
      perception_model: 'raven-0'
    };

    response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(ravenPayload),
    });

    if (response.ok) {
      const persona = await response.json();
      console.log('✅ Raven persona created:', persona.persona_id);
      console.log('🧠 Perception model:', persona.perception_model);
      
      // Clean up
      await fetch(`https://tavusapi.com/v2/personas/${persona.persona_id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': apiKey }
      });
    } else {
      const error = await response.text();
      console.log('❌ Raven failed:', response.status, error);
    }

    // Test 3: Check what fields are in the API docs by trying different variations
    console.log('\n📋 Testing alternative field names...');
    const alternatives = [
      { perception: 'raven-0' },
      { perception_analysis: 'raven-0' },
      { perception_enabled: true },
      { raven_model: 'raven-0' },
      { analysis_model: 'raven-0' }
    ];

    for (const alt of alternatives) {
      const testPayload = {
        ...minimalPayload,
        persona_name: `Test Alt ${Object.keys(alt)[0]}`,
        ...alt
      };

      response = await fetch('https://tavusapi.com/v2/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        const persona = await response.json();
        console.log(`✅ ${Object.keys(alt)[0]} worked:`, persona.persona_id);
        
        // Clean up
        await fetch(`https://tavusapi.com/v2/personas/${persona.persona_id}`, {
          method: 'DELETE',
          headers: { 'x-api-key': apiKey }
        });
      } else {
        const error = await response.text();
        console.log(`❌ ${Object.keys(alt)[0]} failed:`, response.status);
      }
    }

  } catch (error) {
    console.error('💥 Error during testing:', error);
  }
}

testPersonaCreation().catch(console.error);