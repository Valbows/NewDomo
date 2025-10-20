#!/usr/bin/env npx tsx
/**
 * Diagnose the API issue by checking all components
 */

async function checkTavusAPI() {
  console.log("🔍 Checking Tavus API configuration...\n");
  
  const apiKey = '9e3a9a6a54e44edaa2e456191ba0d0f3';
  const baseUrl = 'https://tavusapi.com/v2';
  const personaId = 'pe9ed46b7319';
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
      console.log(\`❌ Persona not accessible: \${personaResp.status} \${personaResp.statusText}\`);
      const error = await personaResp.text();
      console.log(\`   Error: \${error}\`);
      return false;
    }
    
    console.log("");
    
    // Test 2: Try to create a conversation
    console.log("2️⃣ Testing conversation creation...");
    const convPayload = {
      persona_id: personaId,
      replica_id: replicaId
    };
    
    console.log(\`📤 Payload: \${JSON.stringify(convPayload, null, 2)}\`);
    
    const convResp = await fetch(\`\${baseUrl}/conversations/\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(convPayload)
    });
    
    console.log(\`📊 Response: \${convResp.status} \${convResp.statusText}\`);
    
    if (convResp.ok) {
      const conv = await convResp.json();
      console.log("✅ Conversation creation successful");
      console.log(\`   - ID: \${conv.conversation_id}\`);
      console.log(\`   - Status: \${conv.status}\`);
      console.log(\`   - URL: \${conv.conversation_url || 'Not provided'}\`);
      
      if (conv.conversation_url) {
        console.log(\`\n🔗 Direct test link: \${conv.conversation_url}\`);
      }
      
      return true;
    } else {
      const error = await convResp.text();
      console.log(\`❌ Conversation creation failed: \${error}\`);
      
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.message) {
          console.log(\`   Message: \${errorObj.message}\`);
        }
        if (errorObj.details) {
          console.log(\`   Details: \${JSON.stringify(errorObj.details, null, 2)}\`);
        }
      } catch (e) {
        console.log(\`   Raw error: \${error}\`);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error("❌ Tavus API test failed:", error);
    return false;
  }
}

async function checkSupabaseConnection() {
  console.log("\n🔍 Checking Supabase configuration...\n");
  
  const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';
  
  console.log(\`📡 Supabase URL: \${supabaseUrl}\`);
  console.log(\`🔑 Service Key: \${supabaseKey.substring(0, 20)}...\n\`);
  
  try {
    // Test Supabase connection by checking demos
    const response = await fetch(\`\${supabaseUrl}/rest/v1/demos?select=id,name,tavus_persona_id&limit=5\`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': \`Bearer \${supabaseKey}\`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const demos = await response.json();
      console.log("✅ Supabase connection successful");
      console.log(\`📊 Found \${demos.length} demos:\`);
      
      demos.forEach((demo: any, index: number) => {
        console.log(\`   \${index + 1}. \${demo.name || 'Unnamed'} (\${demo.id})\`);
        console.log(\`      Persona: \${demo.tavus_persona_id || 'None'}\`);
      });
      
      // Check if any demo has our target persona
      const hasTargetPersona = demos.some((d: any) => d.tavus_persona_id === 'pe9ed46b7319');
      if (hasTargetPersona) {
        console.log(\`\n✅ Found demos using target persona pe9ed46b7319\`);
      } else {
        console.log(\`\n⚠️ No demos found using target persona pe9ed46b7319\`);
      }
      
      return true;
    } else {
      const error = await response.text();
      console.log(\`❌ Supabase connection failed: \${response.status} \${response.statusText}\`);
      console.log(\`   Error: \${error}\`);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Supabase test failed:", error);
    return false;
  }
}

async function provideDiagnosticSummary(tavusOk: boolean, supabaseOk: boolean) {
  console.log("\n📋 Diagnostic Summary:\n");
  
  console.log(\`🔌 Tavus API: \${tavusOk ? '✅ Working' : '❌ Issues detected'}\`);
  console.log(\`🗄️ Supabase: \${supabaseOk ? '✅ Working' : '❌ Issues detected'}\`);
  
  if (tavusOk && supabaseOk) {
    console.log(\`\n🎉 All systems operational!\`);
    console.log(\`\n💡 If you're still getting 500 errors in your app:\`);
    console.log(\`1. Make sure you're logged in to your app\`);
    console.log(\`2. Check that your Next.js server has restarted with new environment variables\`);
    console.log(\`3. Try refreshing your browser page\`);
    console.log(\`4. Check the browser console for more specific error messages\`);
    
    console.log(\`\n🔗 Direct conversation test (bypasses your app):\`);
    console.log(\`https://app.tavus.io/conversations/new?persona_id=pe9ed46b7319\`);
  } else {
    console.log(\`\n❌ Issues detected that need to be resolved:\`);
    
    if (!tavusOk) {
      console.log(\`- Tavus API configuration or persona setup\`);
    }
    
    if (!supabaseOk) {
      console.log(\`- Supabase database connection or demo records\`);
    }
  }
}

async function main() {
  console.log("🚀 API Issue Diagnostic Tool\n");
  
  try {
    const tavusOk = await checkTavusAPI();
    const supabaseOk = await checkSupabaseConnection();
    
    await provideDiagnosticSummary(tavusOk, supabaseOk);
    
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  }
}

if (require.main === module) {
  main();
}