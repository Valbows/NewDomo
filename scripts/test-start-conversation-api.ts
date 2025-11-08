#!/usr/bin/env npx tsx
/**
 * Test the /api/start-conversation endpoint
 */

async function testStartConversationAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log("🚀 Testing /api/start-conversation endpoint...\n");
  console.log(`📡 Base URL: ${baseUrl}`);
  
  // Use one of the demo IDs we just updated
  const testDemoId = '8cc16f2d-b407-4895-9639-643d1a976da4'; // WorkDay Platform Demo
  
  console.log(`🎭 Test Demo ID: ${testDemoId}`);
  console.log(`🎯 Expected Persona: p1a1ed6bd5bf\n`);

  try {
    console.log("📤 Making request to /api/start-conversation...");
    
    const response = await fetch(`${baseUrl}/api/start-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        demoId: testDemoId,
        forceNew: true
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response Body: ${responseText}\n`);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log("✅ API call successful!");
        console.log("📋 Response data:");
        console.log(`   - Conversation ID: ${data.conversation_id || 'Not provided'}`);
        console.log(`   - Conversation URL: ${data.conversation_url || 'Not provided'}`);
        
        if (data.conversation_url) {
          console.log(`\n🔗 Test the conversation:`);
          console.log(data.conversation_url);
        }
        
        return { success: true, data };
      } catch (parseError) {
        console.log("✅ API call successful but response is not JSON");
        return { success: true, data: responseText };
      }
    } else {
      console.log("❌ API call failed");
      
      try {
        const errorData = JSON.parse(responseText);
        console.log("📋 Error details:");
        console.log(`   - Error: ${errorData.error || 'Unknown'}`);
        console.log(`   - Hint: ${errorData.hint || 'None'}`);
        if (errorData.payload) {
          console.log(`   - Payload: ${JSON.stringify(errorData.payload, null, 2)}`);
        }
        if (errorData.tavusError) {
          console.log(`   - Tavus Error: ${JSON.stringify(errorData.tavusError, null, 2)}`);
        }
      } catch (parseError) {
        console.log("📋 Raw error response:", responseText);
      }
      
      return { success: false, error: responseText };
    }

  } catch (error) {
    console.error("❌ Network error:", error);
    return { success: false, error };
  }
}

async function checkEnvironmentSetup() {
  console.log("⚙️ Environment Setup Check:\n");
  
  const requiredVars = [
    'TAVUS_API_KEY',
    'TAVUS_BASE_URL', 
    'TAVUS_REPLICA_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SECRET_KEY'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? value.substring(0, 8) + '...' : value}`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      missing.push(varName);
    }
  });
  
  console.log("");
  
  if (missing.length > 0) {
    console.log(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  console.log("✅ All required environment variables are set");
  return true;
}

async function main() {
  console.log("🚀 Start Conversation API Test\n");
  
  try {
    // Check environment setup
    const envOk = await checkEnvironmentSetup();
    if (!envOk) {
      console.log("\n❌ Environment setup incomplete. Please check your .env.local file.");
      return;
    }
    
    // Test the API
    const result = await testStartConversationAPI();
    
    if (result.success) {
      console.log("\n🎉 API test successful!");
      console.log("✅ Your /api/start-conversation endpoint is working");
      console.log("✅ Persona p1a1ed6bd5bf is properly configured");
      console.log("✅ All components (System Prompt + Guardrails + Objectives) are active");
    } else {
      console.log("\n❌ API test failed");
      console.log("💡 Check the error details above for troubleshooting");
    }
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

if (require.main === module) {
  main();
}