const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function backfillMissingConversationDetails() {
  console.log('=== BACKFILLING MISSING conversation_details RECORDS ===\n');

  // Get all qualification_data entries that don't have a corresponding conversation_details record
  const { data: qualData } = await supabase
    .from('qualification_data')
    .select('conversation_id, received_at')
    .order('received_at', { ascending: false });

  console.log('Found', qualData?.length || 0, 'qualification_data entries');

  for (const qual of qualData || []) {
    const conversationId = qual.conversation_id;

    // Check if conversation_details record exists
    const { data: existing } = await supabase
      .from('conversation_details')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (existing) {
      console.log('  - ' + conversationId + ': already has conversation_details');
      continue;
    }

    // Find the demo that had this conversation
    // First check current demo
    let demo = null;
    const { data: currentDemo } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (currentDemo) {
      demo = currentDemo;
    } else {
      // Check if any demo in the same time range could be the owner
      // For simplicity, we'll use a known demo ID for the WorkDay Platform Demo
      const { data: workdayDemo } = await supabase
        .from('demos')
        .select('id')
        .eq('name', 'WorkDay Platform Demo')
        .single();

      if (workdayDemo) {
        demo = workdayDemo;
        console.log('  - Using WorkDay Platform Demo for orphaned conversation');
      }
    }

    if (!demo) {
      console.log('  - ' + conversationId + ': no demo found, skipping');
      continue;
    }

    // Create the conversation_details record
    const { error: insertError } = await supabase
      .from('conversation_details')
      .insert({
        demo_id: demo.id,
        tavus_conversation_id: conversationId,
        conversation_name: 'Conversation ' + conversationId.slice(-8),
        status: 'ended',
        started_at: qual.received_at,
        completed_at: qual.received_at,
      });

    if (insertError) {
      console.log('  - ' + conversationId + ': ERROR creating record:', insertError.message);
    } else {
      console.log('  - ' + conversationId + ': CREATED conversation_details record');
    }
  }

  console.log('\n=== BACKFILL COMPLETE ===');

  // Verify the latest conversation is now visible
  const { data: details } = await supabase
    .from('conversation_details')
    .select('tavus_conversation_id, demo_id, status')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\nLatest conversation_details:');
  details?.forEach((d, i) => {
    console.log((i+1) + '. ' + d.tavus_conversation_id + ' - status: ' + d.status);
  });
}

backfillMissingConversationDetails().then(() => process.exit(0));
