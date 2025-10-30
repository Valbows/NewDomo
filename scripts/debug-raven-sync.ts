#!/usr/bin/env tsx

/**
 * Debug script to investigate raven-0 conversation sync issues
 * This will help identify why perception analysis and transcripts aren't being extracted
 */

import { createClient } from '@/lib/utils/supabase';

async function debugRavenSync() {
  console.log('🔍 Debugging raven-0 conversation sync...\n');

  const supabase = createClient();
  const tavusApiKey = process.env.TAVUS_API_KEY;

  if (!tavusApiKey) {
    console.error('❌ TAVUS_API_KEY not found in environment');
    return;
  }

  try {
    // Get a demo with tavus_conversation_id
    const { data: demos, error } = await supabase
      .from('demos')
      .select('id, name, tavus_conversation_id, tavus_persona_id')
      .not('tavus_conversation_id', 'is', null)
      .limit(1);

    if (error || !demos || demos.length === 0) {
      console.error('❌ No demos with Tavus conversations found');
      return;
    }

    const demo = demos[0];
    console.log(`📋 Testing with demo: ${demo.name} (${demo.id})`);
    console.log(`🎭 Persona ID: ${demo.tavus_persona_id}`);
    console.log(`💬 Conversation ID: ${demo.tavus_conversation_id}\n`);

    // 1. Check persona configuration
    console.log('1️⃣ Checking persona configuration...');
    if (demo.tavus_persona_id) {
      const personaResponse = await fetch(
        `https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tavusApiKey,
          },
        }
      );

      if (personaResponse.ok) {
        const personaData = await personaResponse.json();
        console.log(`   ✅ Persona found: ${personaData.name}`);
        console.log(`   🧠 Perception model: ${personaData.perception_model || 'NOT SET'}`);
        console.log(`   🎯 Raven-0 enabled: ${personaData.perception_model === 'raven-0' ? 'YES' : 'NO'}`);
        
        if (personaData.perception_model !== 'raven-0') {
          console.log(`   ⚠️  To enable perception analysis, set perception_model to 'raven-0'`);
          console.log(`   🔧 Fix: POST /api/check-persona-config with personaId and perception_model: 'raven-0'\n`);
        } else {
          console.log(`   ✅ Persona correctly configured for perception analysis\n`);
        }
      } else {
        console.log(`   ❌ Failed to fetch persona: ${personaResponse.status}\n`);
      }
    } else {
      console.log(`   ⚠️  No persona ID found for this demo\n`);
    }

    // 2. Fetch conversation details with verbose=true
    console.log('2️⃣ Fetching conversation details from Tavus...');
    const conversationResponse = await fetch(
      `https://tavusapi.com/v2/conversations/${demo.tavus_conversation_id}?verbose=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      }
    );

    if (!conversationResponse.ok) {
      console.error(`   ❌ Failed to fetch conversation: ${conversationResponse.status}`);
      return;
    }

    const conversationData = await conversationResponse.json();
    console.log(`   ✅ Conversation fetched successfully`);
    console.log(`   📊 Status: ${conversationData.status}`);
    console.log(`   📅 Created: ${conversationData.created_at}`);
    console.log(`   ⏱️  Duration: ${conversationData.duration || 'N/A'} seconds\n`);

    // 3. Analyze the events structure
    console.log('3️⃣ Analyzing events structure...');
    const events = conversationData.events || [];
    console.log(`   📋 Total events: ${events.length}`);
    
    if (events.length > 0) {
      console.log(`   🎯 Event types found:`);
      const eventTypes = [...new Set(events.map((e: any) => e.event_type))];
      eventTypes.forEach(type => {
        const count = events.filter((e: any) => e.event_type === type).length;
        console.log(`      - ${type} (${count})`);
      });
      console.log();

      // 4. Look for transcript events
      console.log('4️⃣ Searching for transcript data...');
      const transcriptEvents = events.filter((event: any) => 
        event.event_type?.includes('transcription') || 
        event.event_type === 'application.transcription_ready'
      );
      
      if (transcriptEvents.length > 0) {
        console.log(`   ✅ Found ${transcriptEvents.length} transcript event(s)`);
        transcriptEvents.forEach((event: any, index: number) => {
          console.log(`   📝 Event ${index + 1}: ${event.event_type}`);
          const transcript = event.properties?.transcript || event.data?.transcript;
          if (transcript) {
            console.log(`      - Transcript entries: ${Array.isArray(transcript) ? transcript.length : 'string format'}`);
            if (Array.isArray(transcript) && transcript.length > 0) {
              console.log(`      - Sample entry:`, transcript[0]);
            }
          } else {
            console.log(`      - No transcript data in properties/data`);
            console.log(`      - Available keys:`, Object.keys(event.properties || {}));
          }
        });
      } else {
        console.log(`   ❌ No transcript events found`);
        console.log(`   🔍 Looking for transcript in other locations...`);
        
        // Check if transcript is at the top level
        if (conversationData.transcript) {
          console.log(`   ✅ Found transcript at top level`);
        } else {
          console.log(`   ❌ No transcript found at top level either`);
        }
      }
      console.log();

      // 5. Look for perception analysis events
      console.log('5️⃣ Searching for perception analysis data...');
      const perceptionEvents = events.filter((event: any) => 
        event.event_type?.includes('perception') || 
        event.event_type === 'application.perception_analysis'
      );
      
      if (perceptionEvents.length > 0) {
        console.log(`   ✅ Found ${perceptionEvents.length} perception event(s)`);
        perceptionEvents.forEach((event: any, index: number) => {
          console.log(`   🧠 Event ${index + 1}: ${event.event_type}`);
          const analysis = event.properties?.analysis || event.data?.analysis;
          if (analysis) {
            console.log(`      - Analysis type: ${typeof analysis}`);
            if (typeof analysis === 'string') {
              console.log(`      - Preview: ${analysis.substring(0, 100)}...`);
            } else {
              console.log(`      - Keys:`, Object.keys(analysis));
            }
          } else {
            console.log(`      - No analysis data in properties/data`);
            console.log(`      - Available keys:`, Object.keys(event.properties || {}));
          }
        });
      } else {
        console.log(`   ❌ No perception analysis events found`);
        console.log(`   🔍 This could mean:`);
        console.log(`      - Persona perception_model is not set to 'raven-0'`);
        console.log(`      - Conversation hasn't completed yet`);
        console.log(`      - Perception analysis is still processing`);
      }
      console.log();

      // 6. Show full event structure for debugging
      console.log('6️⃣ Sample event structure (first event):');
      if (events.length > 0) {
        console.log(JSON.stringify(events[0], null, 2));
      }
    } else {
      console.log(`   ❌ No events found in conversation`);
      console.log(`   🔍 Full conversation keys:`, Object.keys(conversationData));
    }

    // 7. Check current database state
    console.log('\n7️⃣ Checking current database state...');
    const { data: dbConversation } = await supabase
      .from('conversation_details')
      .select('*')
      .eq('tavus_conversation_id', demo.tavus_conversation_id)
      .single();

    if (dbConversation) {
      console.log(`   ✅ Conversation exists in database`);
      console.log(`   📝 Has transcript: ${!!dbConversation.transcript}`);
      console.log(`   🧠 Has perception: ${!!dbConversation.perception_analysis}`);
      console.log(`   📅 Last updated: ${dbConversation.updated_at}`);
    } else {
      console.log(`   ❌ Conversation not found in database`);
    }

  } catch (error) {
    console.error('💥 Error during debug:', error);
  }
}

// Run the debug if this script is executed directly
if (require.main === module) {
  debugRavenSync().catch(console.error);
}

export { debugRavenSync };