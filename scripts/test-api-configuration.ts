#!/usr/bin/env npx tsx
/**
 * Test API configuration and persona pf9364e0f9c1 with current API keys
 */

const TARGET_PERSONA_ID = 'pf9364e0f9c1';

interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  replicaId?: string;
  webhookSecret?: string;
  webhookToken?: string;
  llmModel?: string;
  toolsEnabled?: boolean;
  minimalTools?: boolean;
}

function getApiConfig(): ApiConfig {
  return {
    apiKey: process.env.TAVUS_API_KEY || '',
    baseUrl: process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2',
    replicaId: process.env.TAVUS_REPLICA_ID,
    webhookSecret: process.env.TAVUS_WEBHOOK_SECRET,
    webhookToken: process.env.TAVUS_WEBHOOK_TOKEN,
    llmModel: process.env.TAVUS_LLM_MODEL,
    toolsEnabled: process.env.TAVUS_TOOLS_ENABLED === 'true',
    minimalTools: process.env.TAVUS_MINIMAL_TOOLS === 'true'
  };
}

async function testApiConnection(config: ApiConfig) {
  console.log("🔌 Testing API connection...");
  console.log(`📡 Base URL: ${config.baseUrl}`);
  console.log(`🔑 API Key: ${config.apiKey.substring(0, 8)}...`);

  try {
    const response = await fetch(`${config.baseUrl}/personas/`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey
      }
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API connection successful`);
      console.log(`📋 Found ${data.data?.length || 0} personas`);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log(`❌ API connection failed: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error:`, error);
    return { success: false, error };
  }
}

async function testPersonaAccess(config: ApiConfig, personaId: string) {
  console.log(`\n🎭 Testing persona access: ${personaId}`);

  try {
    const response = await fetch(`${config.baseUrl}/personas/${personaId}`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey
      }
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const persona = await response.json();
      console.log(`✅ Persona found and accessible`);
      console.log(`📋 Persona details:`);
      console.log(`   - ID: ${persona.persona_id}`);
      console.log(`   - Name: ${persona.persona_name || 'Unnamed'}`);
      console.log(`   - System Prompt: ${persona.system_prompt ? 'Present' : 'Missing'}`);
      console.log(`   - Objectives: ${persona.objectives_id || 'None'}`);
      console.log(`   - Guardrails: ${persona.guardrails_id || 'None'}`);
      console.log(`   - Default Replica: ${persona.default_replica_id || 'None'}`);
      console.log(`   - Created: ${persona.created_at}`);
      
      return { success: true, persona };
    } else {
      const errorText = await response.text();
      console.log(`❌ Persona not accessible: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error:`, error);
    return { success: false, error };
  }
}

async function testObjectivesAccess(config: ApiConfig, objectivesId: string) {
  console.log(`\n🎯 Testing objectives access: ${objectivesId}`);

  try {
    const response = await fetch(`${config.baseUrl}/objectives/${objectivesId}`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey
      }
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const objectives = await response.json();
      console.log(`✅ Objectives found and accessible`);
      console.log(`📋 Objectives details:`);
      console.log(`   - ID: ${objectives.uuid}`);
      console.log(`   - Total objectives: ${objectives.data?.length || 0}`);
      console.log(`   - Created: ${objectives.created_at}`);
      
      if (objectives.data && objectives.data.length > 0) {
        console.log(`   - First: ${objectives.data[0]?.objective_name || 'Unknown'}`);
        console.log(`   - Last: ${objectives.data[objectives.data.length - 1]?.objective_name || 'Unknown'}`);
      }
      
      return { success: true, objectives };
    } else {
      const errorText = await response.text();
      console.log(`❌ Objectives not accessible: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error:`, error);
    return { success: false, error };
  }
}

async function testGuardrailsAccess(config: ApiConfig, guardrailsId: string) {
  console.log(`\n🛡️ Testing guardrails access: ${guardrailsId}`);

  try {
    const response = await fetch(`${config.baseUrl}/guardrails/${guardrailsId}`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey
      }
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const guardrails = await response.json();
      console.log(`✅ Guardrails found and accessible`);
      console.log(`📋 Guardrails details:`);
      console.log(`   - ID: ${guardrails.guardrails_id}`);
      console.log(`   - Name: ${guardrails.guardrails_name}`);
      console.log(`   - Created: ${guardrails.created_at}`);
      console.log(`   - Rules count: ${guardrails.data?.length || 0}`);
      
      return { success: true, guardrails };
    } else {
      const errorText = await response.text();
      console.log(`❌ Guardrails not accessible: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error:`, error);
    return { success: false, error };
  }
}

async function testConversationCreation(config: ApiConfig, personaId: string) {
  console.log(`\n💬 Testing conversation creation with persona: ${personaId}`);

  try {
    const conversationPayload: any = {
      persona_id: personaId
    };

    // Add replica if specified
    if (config.replicaId) {
      conversationPayload.replica_id = config.replicaId;
      console.log(`🎭 Using replica: ${config.replicaId}`);
    }

    console.log(`📤 Creating conversation with payload:`, JSON.stringify(conversationPayload, null, 2));

    const response = await fetch(`${config.baseUrl}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(conversationPayload)
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const conversation = await response.json();
      console.log(`✅ Conversation created successfully`);
      console.log(`📋 Conversation details:`);
      console.log(`   - ID: ${conversation.conversation_id}`);
      console.log(`   - Status: ${conversation.status}`);
      console.log(`   - Persona ID: ${conversation.persona_id}`);
      console.log(`   - Replica ID: ${conversation.replica_id || 'None'}`);
      console.log(`   - Created: ${conversation.created_at}`);
      
      if (conversation.conversation_url) {
        console.log(`🔗 Conversation URL: ${conversation.conversation_url}`);
      }
      
      return { success: true, conversation };
    } else {
      const errorText = await response.text();
      console.log(`❌ Conversation creation failed: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Network error:`, error);
    return { success: false, error };
  }
}

async function runFullTest() {
  console.log("🚀 Tavus API Configuration Test\n");

  const config = getApiConfig();

  // Display configuration
  console.log("⚙️ Current Configuration:");
  console.log(`   - API Key: ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : 'Missing'}`);
  console.log(`   - Base URL: ${config.baseUrl}`);
  console.log(`   - Replica ID: ${config.replicaId || 'Not set'}`);
  console.log(`   - LLM Model: ${config.llmModel || 'Default'}`);
  console.log(`   - Tools Enabled: ${config.toolsEnabled}`);
  console.log(`   - Minimal Tools: ${config.minimalTools}`);
  console.log(`   - Webhook Secret: ${config.webhookSecret ? 'Set' : 'Not set'}`);
  console.log(`   - Webhook Token: ${config.webhookToken ? 'Set' : 'Not set'}`);
  console.log("");

  if (!config.apiKey) {
    console.log("❌ TAVUS_API_KEY is missing from environment variables");
    return;
  }

  try {
    // Test 1: API Connection
    const apiTest = await testApiConnection(config);
    if (!apiTest.success) {
      console.log("❌ API connection failed. Cannot proceed with further tests.");
      return;
    }

    // Test 2: Persona Access
    const personaTest = await testPersonaAccess(config, TARGET_PERSONA_ID);
    if (!personaTest.success) {
      console.log("❌ Persona access failed. Cannot proceed with component tests.");
      return;
    }

    const persona = personaTest.persona;

    // Test 3: Objectives (if present)
    if (persona.objectives_id) {
      await testObjectivesAccess(config, persona.objectives_id);
    } else {
      console.log("\n🎯 No objectives attached to persona");
    }

    // Test 4: Guardrails (if present)
    if (persona.guardrails_id) {
      await testGuardrailsAccess(config, persona.guardrails_id);
    } else {
      console.log("\n🛡️ No guardrails attached to persona");
    }

    // Test 5: Conversation Creation
    await testConversationCreation(config, TARGET_PERSONA_ID);

    // Summary
    console.log("\n📊 Test Summary:");
    console.log(`✅ API Connection: Working`);
    console.log(`✅ Persona Access: Working`);
    console.log(`${persona.objectives_id ? '✅' : '⚠️'} Objectives: ${persona.objectives_id ? 'Present' : 'Missing'}`);
    console.log(`${persona.guardrails_id ? '✅' : '⚠️'} Guardrails: ${persona.guardrails_id ? 'Present' : 'Missing'}`);
    
    console.log(`\n🎉 Configuration test complete!`);
    console.log(`🎭 Persona ${TARGET_PERSONA_ID} is ready for use with your API`);

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  try {
    await runFullTest();
  } catch (error) {
    console.error("\n❌ Configuration test failed:", error);
    console.log("\n💡 Make sure you have:");
    console.log("1. TAVUS_API_KEY set in your .env.local");
    console.log("2. Valid API access with your Tavus account");
    console.log("3. Proper network connectivity");
  }
}

if (require.main === module) {
  main();
}