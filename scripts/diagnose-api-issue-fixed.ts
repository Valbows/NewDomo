#!/usr/bin/env npx tsx
/**
 * Diagnose the API issue by checking all components
 */

async function checkTavusAPI() {
  console.log("🔍 Checking Tavus API configuration...\n");
  
  const apiKey = '9e3a9a6a54e44edaa2e456191ba0d0f3';
  const baseUrl = 'https://tavusapi.com/v2';
  const personaId = 'p1a1ed6bd5bf';
  const replicaId = 'rf4703150052';
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`📡 Base URL: ${baseUrl}`);
  console.log(`🎭 Persona ID: ${personaId}`);
  console.log(`🎬 Replica ID: ${replicaId}\n`);
  
  try {
    // Test 1: Check persona exists and is accessible
    console.log("1️⃣ Testing persona access...");
    const personaResp = await fetch(`${baseUrl}/personas/${personaId}`, {
      headers: { 'x-api-key': apiKey }
    });
    
    if (personaResp.ok) {
      const persona = await personaResp.json();
      console.log("✅ Persona accessible");
      console.log(`   - Name: ${persona.persona_name}`);
      console.log(`   - System Prompt: ${persona.system_prompt ? 'Present' : 'Missing'}`);
      console.log(`   - Guardrails: ${persona.guardrails_id || 'Missing'}`);
      console.log(`   - Objectives: ${persona.objectives_id || 'Missing'}`);
      console.log(`   - Default Replica: ${persona.default_replica_id || 'None'}`);
    } else {
      console.log(`❌ Persona not accessible: ${personaResp.status} ${personaResp.statusText}`);
      const error = await personaResp.text();
      console.log(`   Error: ${error}`);
      return false;
    }
    
    console.log("");
    
    // Test 2: Try to create a conversation
    console.log("2️⃣ Testing conversation creation...");
    const convPayload = {
      persona_id: personaId,
      replica_id: replicaId
    };
    
    console.log(`📤 Payload: ${JSON.stringify(convPayload, null, 2)}`);
    
    const convResp = await fetch(`${baseUrl}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(convPayload)
    });
    
    console.log(`📊 Response: ${convResp.status} ${convResp.statusText}`);
    
    if (convResp.ok) {
      const conv = await convResp.json();
      console.log("✅ Conversation creation successful");
      console.log(`   - ID: ${conv.conversation_id}`);
      console.log(`   - Status: ${conv.status}`);
      console.log(`   - URL: ${conv.conversation_url || 'Not provided'}`);
      
      if (conv.conversation_url) {
        console.log(`\n🔗 Direct test link: ${conv.conversation_url}`);
      }
      
      return true;
    } else {
      const error = await convResp.text();
      console.log(`❌ Conversation creation failed: ${error}`);
      
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.message) {
          console.log(`   Message: ${errorObj.message}`);
        }
        if (errorObj.details) {
          console.log(`   Details: ${JSON.stringify(errorObj.details, null, 2)}`);
        }
      } catch (e) {
        console.log(`   Raw error: ${error}`);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error("❌ Tavus API test failed:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 API Issue Diagnostic Tool\n");
  
  try {
    const tavusOk = await checkTavusAPI();
    
    console.log("\n📋 Diagnostic Summary:\n");
    console.log(`🔌 Tavus API: ${tavusOk ? '✅ Working' : '❌ Issues detected'}`);
    
    if (tavusOk) {
      console.log(`\n🎉 Tavus API is working correctly!`);
      console.log(`\n💡 If you're still getting 500 errors in your app:`);
      console.log(`1. Make sure you're logged in to your app`);
      console.log(`2. Restart your Next.js server: npm run dev`);
      console.log(`3. Try refreshing your browser page`);
      console.log(`4. Check the browser console for more specific error messages`);
      
      console.log(`\n🔗 Direct conversation test (bypasses your app):`);
      console.log(`https://app.tavus.io/conversations/new?persona_id=p1a1ed6bd5bf`);
    } else {
      console.log(`\n❌ Tavus API issues detected - check the errors above`);
    }
    
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  }
}

if (require.main === module) {
  main();
}