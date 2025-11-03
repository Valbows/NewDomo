#!/usr/bin/env node

/**
 * Check all demos and update the one with the old Tavus URL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OLD_URL = 'https://tavus.daily.co/c4fe82e31ff4d43a';
const NEW_URL = 'https://tavus.daily.co/ca044349a5ba247a';
const NEW_CONVERSATION_ID = 'ca044349a5ba247a';

async function checkAndFixDemoUrls() {
  console.log('🔍 Checking All Demo Tavus URLs');
  console.log('===============================\n');

  try {
    const { data: demos, error } = await supabase
      .from('demos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching demos:', error);
      return;
    }

    console.log(`Found ${demos.length} demos:\n`);

    let updatedCount = 0;

    for (const demo of demos) {
      console.log(`📋 Demo: ${demo.name}`);
      console.log(`   ID: ${demo.id}`);
      
      let metadata = demo.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = {};
        }
      }

      const currentUrl = metadata?.tavusShareableLink;
      console.log(`   Current URL: ${currentUrl || 'Not set'}`);

      // Check if this demo has the old URL
      if (currentUrl === OLD_URL) {
        console.log('   🔄 UPDATING with new URL...');
        
        const updatedMetadata = {
          ...metadata,
          tavusShareableLink: NEW_URL,
          tavusConversationId: NEW_CONVERSATION_ID,
          tavusUpdatedAt: new Date().toISOString(),
          oldTavusUrl: OLD_URL // Keep track of what we replaced
        };

        const { error: updateError } = await supabase
          .from('demos')
          .update({
            metadata: updatedMetadata,
            tavus_conversation_id: NEW_CONVERSATION_ID
          })
          .eq('id', demo.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully!`);
          updatedCount++;
        }
      } else if (currentUrl === NEW_URL) {
        console.log('   ✅ Already has new URL');
      } else {
        console.log('   ℹ️  Different URL (not the problematic one)');
      }
      
      console.log('');
    }

    console.log(`🎯 Summary: Updated ${updatedCount} demo(s) with new Tavus URL`);
    
    if (updatedCount > 0) {
      console.log('\n🔄 Next Steps:');
      console.log('1. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)');
      console.log('2. Clear browser cache if needed');
      console.log('3. Navigate to demo and click "View Demo Experience"');
      console.log('4. Should now use the new URL and connect successfully');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixDemoUrls();