const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkObjectives() {
  console.log('🔍 Checking demo objectives configuration...\n');

  // Get demo data
  const { data: demoData } = await supabase
    .from('demos')
    .select('*')
    .eq('name', 'WorkDay Platform Demo')
    .limit(1);

  if (demoData && demoData.length > 0) {
    const demo = demoData[0];
    console.log('📋 Demo Configuration:');
    console.log(`   Demo ID: ${demo.id}`);
    console.log(`   Agent Name: ${demo.agent_name}`);
    console.log(`   Objectives ID: ${demo.objectives_id || 'Not set'}`);
    console.log(`   Metadata Objectives: ${JSON.stringify(demo.metadata?.objectives || [], null, 2)}`);
    
    // Check if there are any objective completions for this conversation
    const conversationId = 'c747544530dac4c9';
    
    console.log(`\n🎯 Checking objective completions for conversation: ${conversationId}`);
    
    // Check conversation details for any objective data
    const { data: conversationData } = await supabase
      .from('conversation_details')
      .select('*')
      .eq('tavus_conversation_id', conversationId);
    
    if (conversationData && conversationData.length > 0) {
      console.log('📊 Conversation Details:');
      console.log(`   Status: ${conversationData[0].status}`);
      console.log(`   Duration: ${conversationData[0].duration_seconds}s`);
      console.log(`   Has Transcript: ${!!conversationData[0].transcript}`);
      console.log(`   Has Perception: ${!!conversationData[0].perception_analysis}`);
    }
    
    // Check all tables for any data related to this conversation
    console.log('\n📊 Data Captured for this Conversation:');
    
    const tables = [
      'qualification_data',
      'product_interest_data', 
      'video_showcase_data',
      'cta_tracking'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('conversation_id', conversationId);
      
      console.log(`   ${table}: ${data?.length || 0} records`);
      if (data && data.length > 0) {
        console.log(`     Sample: ${JSON.stringify(data[0], null, 4).substring(0, 200)}...`);
      }
    }
  }
}

checkObjectives().catch(console.error);