#!/usr/bin/env node

/**
 * Create a new Tavus conversation and update demo metadata
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

async function createNewTavusConversation() {
  console.log('🚀 Creating New Tavus Conversation');
  console.log('==================================\n');

  try {
    // Step 1: Find demos that need new Tavus conversations
    console.log('1. Checking existing demos...');
    
    const { data: demos, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .order('created_at', { ascending: false });

    if (demoError) {
      console.error('❌ Error fetching demos:', demoError);
      return;
    }

    if (!demos || demos.length === 0) {
      console.log('❌ No demos found. Please create a demo first.');
      return;
    }

    console.log(`✅ Found ${demos.length} demos\n`);

    // Step 2: Create new Tavus conversation
    console.log('2. Creating new Tavus conversation...');
    
    const conversationPayload = {
      replica_id: REPLICA_ID,
      persona_id: PERSONA_ID,
      conversation_name: `Demo Conversation ${new Date().toISOString()}`,
      callback_url: process.env.NEXT_PUBLIC_BASE_URL + '/api/tavus-webhook'
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

    console.log('\n📋 New Conversation Details:');
    console.log('  - Conversation ID:', conversationId);
    console.log('  - Shareable URL:', newTavusUrl);
    console.log('  - Room ID:', newTavusUrl.split('/').pop());

    // Step 3: Update the first demo with the new URL
    const targetDemo = demos[0];
    console.log(`\n3. Updating demo "${targetDemo.name}" with new Tavus URL...`);

    let metadata = targetDemo.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Update metadata with new Tavus info
    const updatedMetadata = {
      ...metadata,
      tavusShareableLink: newTavusUrl,
      tavusConversationId: conversationId,
      tavusUpdatedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('demos')
      .update({
        metadata: updatedMetadata,
        tavus_conversation_id: conversationId
      })
      .eq('id', targetDemo.id);

    if (updateError) {
      console.error('❌ Error updating demo:', updateError);
      return;
    }

    console.log('✅ Demo updated successfully!');

    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Refresh your browser');
    console.log('2. Go to demo configure page');
    console.log('3. Click "View Demo Experience"');
    console.log('4. Should connect without "Connecting..." issue');
    console.log('');
    console.log('🔗 Test URL:');
    console.log(`   http://localhost:3001/demos/${targetDemo.id}/experience`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createNewTavusConversation();