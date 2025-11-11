const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCtaIssue() {
  console.log('🔍 Checking CTA tracking issue...\n');

  // Check for CTA data with the old conversation ID (from demo metadata)
  const oldConversationId = 'c9c623466826c4cc';
  const newConversationId = 'c747544530dac4c9';

  console.log(`📊 Checking CTA data for old conversation ID: ${oldConversationId}`);
  const { data: oldCtaData } = await supabase
    .from('cta_tracking')
    .select('*')
    .eq('conversation_id', oldConversationId);

  console.log(`📊 Checking CTA data for new conversation ID: ${newConversationId}`);
  const { data: newCtaData } = await supabase
    .from('cta_tracking')
    .select('*')
    .eq('conversation_id', newConversationId);

  console.log('\n🎯 CTA Tracking Results:');
  console.log(`   Old Conversation ID (${oldConversationId}): ${oldCtaData?.length || 0} records`);
  if (oldCtaData && oldCtaData.length > 0) {
    console.log('   📋 Old CTA Data:', JSON.stringify(oldCtaData[0], null, 2));
  }
  
  console.log(`   New Conversation ID (${newConversationId}): ${newCtaData?.length || 0} records`);
  if (newCtaData && newCtaData.length > 0) {
    console.log('   📋 New CTA Data:', JSON.stringify(newCtaData[0], null, 2));
  }

  // Check demo data to see what conversation ID is stored
  const { data: demoData } = await supabase
    .from('demos')
    .select('id, name, tavus_conversation_id, metadata')
    .eq('name', 'WorkDay Platform Demo')
    .limit(1);

  console.log('\n📋 Demo Configuration:');
  if (demoData && demoData.length > 0) {
    const demo = demoData[0];
    console.log(`   Demo ID: ${demo.id}`);
    console.log(`   Stored Conversation ID: ${demo.tavus_conversation_id}`);
    console.log(`   Metadata: ${JSON.stringify(demo.metadata, null, 2)}`);
  }

  console.log('\n💡 ISSUE ANALYSIS:');
  console.log('   The problem is that the CTA tracking is using the old conversation ID');
  console.log('   from the demo metadata, but the actual conversation used a new ID.');
  console.log('   This happens because Tavus creates a new conversation URL each time.');
}

checkCtaIssue().catch(console.error);