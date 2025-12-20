const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

// Set to true to actually delete, false to just preview
const DRY_RUN = process.argv.includes('--delete') ? false : true;

async function calculateDomoScore(conversationId) {
  // Check each component
  const { data: qualData } = await supabase
    .from('qualification_data')
    .select('id')
    .eq('conversation_id', conversationId)
    .limit(1);

  const { data: productData } = await supabase
    .from('product_interest_data')
    .select('id')
    .eq('conversation_id', conversationId)
    .limit(1);

  const { data: videoData } = await supabase
    .from('video_showcase_data')
    .select('videos_shown')
    .eq('conversation_id', conversationId)
    .limit(1);

  const { data: ctaData } = await supabase
    .from('cta_tracking')
    .select('cta_clicked_at')
    .eq('conversation_id', conversationId)
    .limit(1);

  const { data: convData } = await supabase
    .from('conversation_details')
    .select('perception_analysis')
    .eq('tavus_conversation_id', conversationId)
    .limit(1);

  const scores = {
    contactConfirmation: qualData && qualData.length > 0,
    reasonForVisit: productData && productData.length > 0,
    platformFeatureInterest: videoData && videoData.length > 0 && videoData[0].videos_shown && videoData[0].videos_shown.length > 0,
    ctaExecution: ctaData && ctaData.length > 0 && ctaData[0].cta_clicked_at,
    perceptionAnalysis: convData && convData.length > 0 && convData[0].perception_analysis
  };

  return Object.values(scores).filter(Boolean).length;
}

async function deleteConversationData(conversationId) {
  console.log(`   🗑️  Deleting data for: ${conversationId}`);

  // Delete from all related tables
  const tables = [
    { name: 'qualification_data', column: 'conversation_id' },
    { name: 'product_interest_data', column: 'conversation_id' },
    { name: 'video_showcase_data', column: 'conversation_id' },
    { name: 'cta_tracking', column: 'conversation_id' },
    { name: 'conversation_details', column: 'tavus_conversation_id' }
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table.name)
      .delete()
      .eq(table.column, conversationId);

    if (error) {
      console.log(`      ⚠️  Error deleting from ${table.name}: ${error.message}`);
    } else {
      console.log(`      ✅ Deleted from ${table.name}`);
    }
  }
}

async function main() {
  console.log('🔍 Finding all conversations with Domo Score 0-2...\n');

  if (DRY_RUN) {
    console.log('📋 DRY RUN MODE - No data will be deleted');
    console.log('   Run with --delete flag to actually delete\n');
  } else {
    console.log('⚠️  DELETE MODE - Data will be permanently deleted!\n');
  }

  // Get all conversation IDs from conversation_details
  const { data: allConversations, error } = await supabase
    .from('conversation_details')
    .select('tavus_conversation_id, conversation_name, created_at, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error.message);
    return;
  }

  console.log(`Found ${allConversations.length} total conversations\n`);

  const lowScoreConversations = [];

  for (const conv of allConversations) {
    const score = await calculateDomoScore(conv.tavus_conversation_id);
    if (score >= 0 && score <= 2) {
      lowScoreConversations.push({
        id: conv.tavus_conversation_id,
        name: conv.conversation_name,
        created: conv.created_at,
        status: conv.status,
        score
      });
    }
  }

  console.log(`\n📊 Found ${lowScoreConversations.length} conversations with score 0-2:\n`);
  console.log('─'.repeat(100));

  for (const conv of lowScoreConversations) {
    const date = new Date(conv.created).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
    console.log(`Score ${conv.score}/5 | ${date} | ${conv.status || 'unknown'} | ${conv.id}`);
    console.log(`         Name: ${conv.name || 'Unnamed'}`);
    console.log('');
  }

  console.log('─'.repeat(100));
  console.log(`\nTotal: ${lowScoreConversations.length} conversations to delete\n`);

  if (!DRY_RUN && lowScoreConversations.length > 0) {
    console.log('🗑️  Deleting conversations...\n');

    for (const conv of lowScoreConversations) {
      await deleteConversationData(conv.id);
      console.log('');
    }

    console.log('\n✅ Deletion complete!');
  } else if (DRY_RUN && lowScoreConversations.length > 0) {
    console.log('To delete these conversations, run:');
    console.log('   node scripts/database/delete-low-domo-scores.js --delete\n');
  }
}

main().catch(console.error);
