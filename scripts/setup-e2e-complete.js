#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fetch from "node-fetch";

config({ path: ".env.development" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_BASE_URL = process.env.TAVUS_BASE_URL || "https://tavusapi.com/v2";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

if (!TAVUS_API_KEY) {
  console.error("❌ Missing TAVUS_API_KEY - required for real API testing");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Tavus API helper
async function callTavusAPI(endpoint, method = "GET", body = null) {
  const url = `${TAVUS_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "x-api-key": TAVUS_API_KEY,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Tavus API error: ${response.status} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

(async () => {
  console.log("🚀 Setting up complete E2E test environment...");

  const email = "test@example.com";
  const password = "password123";
  const demoId = "42beb287-f385-4100-86a4-bfe7008d531b";

  // 1. Ensure user exists
  const list = await admin.auth.admin.listUsers();
  if (list.error) throw list.error;
  let user = list.data.users.find((u) => u.email === email);

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    user = created.data.user;
    console.log("✅ User created:", user.id);
  } else {
    console.log("✅ User exists:", user.id);
  }

  // 2. Clean up existing test data
  await admin.from("demo_videos").delete().eq("demo_id", demoId);
  await admin.from("demos").delete().eq("id", demoId);
  console.log("🗑️  Cleaned existing test data");

  // 3. Create or get Tavus persona for E2E testing
  let personaId = process.env.COMPLETE_PERSONA_ID;

  if (!personaId) {
    console.log("🤖 Creating Tavus persona for E2E testing...");
    try {
      const personaData = {
        persona_name: "E2E Test Agent",
        system_prompt:
          "You are a helpful AI assistant for E2E testing. You can play videos and show CTAs when requested.",
        context:
          "This is an E2E test environment for demonstrating video playback and CTA functionality.",
        default_replica_id: process.env.TAVUS_REPLICA_ID,
        layers: {
          llm: {
            model: process.env.TAVUS_LLM_MODEL || "tavus-llama-4",
          },
        },
      };

      const persona = await callTavusAPI("/personas", "POST", personaData);
      personaId = persona.persona_id;
      console.log(`✅ Created Tavus persona: ${personaId}`);
    } catch (error) {
      console.warn("⚠️  Could not create Tavus persona:", error.message);
      console.log("📝 Using existing persona ID from environment");
    }
  } else {
    console.log(`✅ Using existing Tavus persona: ${personaId}`);
  }

  // 4. Create demo with proper metadata
  const metadata = {
    uploadId: demoId,
    userId: user.id,
    fileName: "live-e2e.json",
    fileType: "application/json",
    fileSize: "1024",
    uploadTimestamp: new Date().toISOString(),
    agentName: "E2E Test Agent",
    agentPersonality: "Helpful AI assistant for testing",
    agentGreeting: "Hello! I'm ready to help with your E2E testing.",
  };

  const demoResult = await admin.from("demos").insert({
    id: demoId,
    name: "Live E2E Demo",
    user_id: user.id,
    tavus_persona_id: personaId,
    video_storage_path: "test-videos/",
    metadata,
    cta_title: "Try Pro",
    cta_message: "Unlock features",
    cta_button_text: "Start Free Trial",
    cta_button_url: "https://example.com/trial",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (demoResult.error) throw demoResult.error;
  console.log("✅ Demo created with Tavus persona");

  // 5. Start a real Tavus conversation for E2E testing
  let conversationUrl = null;
  try {
    console.log("🎬 Starting Tavus conversation...");
    
    // First, get the persona details to ensure we have the right replica
    const personaDetails = await callTavusAPI(`/personas/${personaId}`);
    const replicaId = personaDetails.default_replica_id || process.env.TAVUS_REPLICA_ID;
    
    if (!replicaId) {
      throw new Error("No replica ID available for persona");
    }
    
    console.log(`📋 Using replica: ${replicaId}`);
    
    const conversationData = {
      persona_id: personaId,
      replica_id: replicaId,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tavus/webhook?t=${process.env.TAVUS_WEBHOOK_TOKEN || 'test-token'}`,
      properties: {
        max_call_duration: 600, // 10 minutes for testing
        participant_left_timeout: 120,
        participant_absent_timeout: 30,
      }
    };
    
    const conversation = await callTavusAPI('/conversations', 'POST', conversationData);
    conversationUrl = conversation.conversation_url;
    
    // Update demo with conversation URL
    const updateResult = await admin
      .from("demos")
      .update({
        tavus_conversation_id: conversation.conversation_id,
        metadata: {
          ...metadata,
          tavusShareableLink: conversationUrl,
          conversationId: conversation.conversation_id,
        }
      })
      .eq("id", demoId);
    
    if (updateResult.error) {
      console.warn("⚠️  Could not update demo with conversation URL:", updateResult.error.message);
    } else {
      console.log(`✅ Started Tavus conversation: ${conversation.conversation_id}`);
      console.log(`🔗 Conversation URL: ${conversationUrl}`);
    }
  } catch (error) {
    console.warn("⚠️  Could not start Tavus conversation:", error.message);
    console.log("📝 Demo will use fallback conversation handling");
  }

  // 6. Create test videos with real storage URLs
  // Note: These use publicly available test videos that actually work
  const testVideos = [
    {
      demo_id: demoId,
      title: "E2E Test Video",
      storage_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      order_index: 1,
      duration_seconds: 30,
      transcript:
        "This is a test video for E2E testing featuring Big Buck Bunny.",
      processing_status: "completed",
      created_at: new Date().toISOString(),
    },
    {
      demo_id: demoId,
      title: "Strategic Planning",
      storage_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      order_index: 2,
      duration_seconds: 45,
      transcript:
        "This video covers strategic planning concepts using Elephants Dream.",
      processing_status: "completed",
      created_at: new Date().toISOString(),
    },
    {
      demo_id: demoId,
      title: "Product Demo",
      storage_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      order_index: 3,
      duration_seconds: 60,
      transcript:
        "This is a product demonstration video featuring For Bigger Blazes.",
      processing_status: "completed",
      created_at: new Date().toISOString(),
    },
  ];

  for (const video of testVideos) {
    const result = await admin.from("demo_videos").insert(video);
    if (result.error) {
      console.error(
        `❌ Failed to insert video "${video.title}":`,
        result.error.message
      );
    } else {
      console.log(`✅ Inserted video: ${video.title}`);
    }
  }

  console.log("🎉 Complete E2E setup finished!");
  console.log("📋 Test environment ready:");
  console.log(`   - User: ${email}`);
  console.log(`   - Demo ID: ${demoId}`);
  console.log(`   - Videos: ${testVideos.length} test videos`);
})().catch((e) => {
  console.error("❌ E2E setup failed:", e);
  process.exit(1);
});
