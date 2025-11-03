#!/usr/bin/env node

/**
 * Create a new active Tavus conversation that stays open
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TAVUS_API_KEY = '9e3a9a6a54e44edaa2e456191ba0d0f3';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';
const REPLICA_ID = 'rf4703150052';
const PERSONA_ID = 'p278d060d473';

async function createActiveTavusConversation() {
  console.log('🚀 Creating Active Tavus Conversation');
  console.log('====================================\n');

  try {
    // Step 1: Create conversation with proper configuration
    console.log('1. Creating new Tavus conversation...');
    
    const conversationPayload = {
      replica_id: REPLICA_ID,
      persona_id: PERSONA_ID,
      conversation_name: `Active Demo ${new Date().toISOString()}`,
      callback_url: 'https://domo-kelvin-webhook.loca.lt/api/tavus-webhook',
      // Add properties to keep conversation active
      properties: {
        max_call_duration: 3600, // 1 hour
        enable_recording: false,
        enable_transcription: true
      }
    };

    console.log('Payload:', JSON.stringify(conversationPayload, null, 2));

    const response = await fetch(`${TAVUS_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversationPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tavus API error:', response.status, errorText);
      return;
    }

    const conversationData = await response.json();
    console.log('✅ New conversation created:', conversationData);

    const newTavusUrl = conversationData.conversation_url;
    const conversationId = conversationData.conversation_id;

    // Step 2: Verify conversation is active
    console.log('\n2. Verifying conversation status...');
    
    const statusResponse = await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}`, {
      headers: {
        'x-api-key': TAVUS_API_KEY
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Conversation status:', statusData.status);
      
      if (statusData.status !== 'active') {
        console.log('⚠️  Warning: Conversation is not active, it may end quickly');
      }
    }

    // Step 3: Update ALL WorkDay Platform demos
    console.log('\n3. Updating all WorkDay Platform demos...');
    
    const { data: demos, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .ilike('name', '%WorkDay Platform Demo%');

    if (demoError) {
      console.error('❌ Error fetching demos:', demoError);
      return;
    }

    console.log(`Found ${demos.length} WorkDay Platform demos to update`);

    for (const demo of demos) {
      console.log(`\nUpdating: ${demo.name} (${demo.id})`);
      
      let metadata = demo.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = {};
        }
      }

      const updatedMetadata = {
        ...metadata,
        tavusShareableLink: newTavusUrl,
        tavusConversationId: conversationId,
        tavusUpdatedAt: new Date().toISOString(),
        previousTavusUrl: metadata?.tavusShareableLink // Keep track of old URL
      };

      const { error: updateError } = await supabase
        .from('demos')
        .update({
          metadata: updatedMetadata,
          tavus_conversation_id: conversationId
        })
        .eq('id', demo.id);

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully`);
      }
    }

    console.log('\n🎯 Testing Instructions:');
    console.log('========================');
    console.log('1. Hard refresh browser (Cmd+Shift+R)');
    console.log('2. Go to WorkDay Platform Demo');
    console.log('3. Click "View Demo Experience"');
    console.log('4. Watch console for connection status');
    console.log('');
    console.log('Expected console output:');
    console.log('  🎥 CVI: Joining call with URL: https://tavus.daily.co/ca044349a5ba247a');
    console.log('  🎯 CVI Meeting State: new');
    console.log('  🎯 CVI Meeting State: joining  ← Should see this');
    console.log('  🎯 CVI Meeting State: joined   ← Success!');
    console.log('');
    console.log('If still fails (new → left-meeting):');
    console.log('  → This indicates a WebRTC/network issue');
    console.log('  → Try mobile hotspot or different network');
    console.log('  → May need to contact Tavus support');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createActiveTavusConversation();