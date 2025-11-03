#!/usr/bin/env node

/**
 * Check the Tavus URL stored in a demo's metadata
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTgxODMsImV4cCI6MjA3MjMzNDE4M30.YmVUBMGLCw_2ncKE9nU0lneZi1xCbYspVn7iqjoFhuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDemoTavusUrl() {
  console.log('🔍 Checking all demos in your database');
  console.log('=====================================\n');

  try {
    // First, let's see what demos you have
    const { data: demos, error: listError } = await supabase
      .from('demos')
      .select('id, name, created_at, metadata')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Error fetching demos:', listError);
      return;
    }

    if (!demos || demos.length === 0) {
      console.log('❌ No demos found in database');
      return;
    }

    console.log(`✅ Found ${demos.length} demos:\n`);

    demos.forEach((demo, index) => {
      console.log(`${index + 1}. ${demo.name}`);
      console.log(`   ID: ${demo.id}`);
      console.log(`   Created: ${demo.created_at}`);
      
      // Parse metadata
      let metadata = demo.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = null;
        }
      }
      
      const tavusLink = metadata?.tavusShareableLink;
      if (tavusLink) {
        console.log(`   Tavus URL: ${tavusLink}`);
        
        // Extract room ID
        const match = tavusLink.match(/https:\/\/tavus\.daily\.co\/([a-f0-9]+)/);
        if (match) {
          console.log(`   Room ID: ${match[1]}`);
        }
      } else {
        console.log(`   Tavus URL: Not configured`);
      }
      console.log('');
    });

    // Now check the first demo with a Tavus URL
    const demoWithTavus = demos.find(demo => {
      let metadata = demo.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          return false;
        }
      }
      return metadata?.tavusShareableLink;
    });

    if (demoWithTavus) {
      console.log('🔗 Analyzing first demo with Tavus URL:');
      console.log('=======================================');
      
      let metadata = demoWithTavus.metadata;
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      
      const url = metadata.tavusShareableLink;
      console.log('Demo:', demoWithTavus.name);
      console.log('URL:', url);
      
      console.log('\n🕐 How this URL was originally created:');
      console.log('1. Demo creation process called Tavus API');
      console.log('2. Tavus created a new conversation/room');
      console.log('3. Tavus returned this shareable Daily.co URL');
      console.log('4. URL was stored in demo metadata');
      console.log('5. Experience page loads this URL for connection');
    }

    if (error) {
      console.error('❌ Error fetching demo:', error);
      return;
    }

    if (!demo) {
      console.log('❌ Demo not found');
      return;
    }

    console.log('✅ Demo found:');
    console.log('  - Name:', demo.name);
    console.log('  - ID:', demo.id);
    console.log('  - Created:', demo.created_at);
    console.log('');

    // Parse metadata
    let metadata = demo.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('❌ Failed to parse metadata:', e);
        return;
      }
    }

    console.log('📋 Metadata:');
    console.log('  - Tavus Agent ID:', metadata?.tavusAgentId || 'Not set');
    console.log('  - Tavus Persona ID:', metadata?.tavusPersonaId || 'Not set');
    console.log('  - Tavus Shareable Link:', metadata?.tavusShareableLink || 'Not set');
    console.log('');

    if (metadata?.tavusShareableLink) {
      const url = metadata.tavusShareableLink;
      console.log('🔗 Tavus URL Analysis:');
      console.log('  - Full URL:', url);
      
      // Extract room ID from URL
      const match = url.match(/https:\/\/tavus\.daily\.co\/([a-f0-9]+)/);
      if (match) {
        console.log('  - Room ID:', match[1]);
        console.log('  - Domain:', 'tavus.daily.co');
      } else {
        console.log('  - ❌ Invalid URL format');
      }
      
      console.log('');
      console.log('🕐 How this URL was created:');
      console.log('  1. When you created this demo, a Tavus conversation was created');
      console.log('  2. Tavus API returned a shareable link with this room ID');
      console.log('  3. This link was stored in the demo metadata');
      console.log('  4. The experience page uses this link to connect');
      console.log('');
      console.log('⚠️  If stuck at "Connecting...", this room may be:');
      console.log('  - Expired (Tavus rooms have time limits)');
      console.log('  - Invalid (room was deleted)');
      console.log('  - Network blocked (firewall/proxy issues)');
    } else {
      console.log('❌ No Tavus shareable link found in metadata');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDemoTavusUrl();