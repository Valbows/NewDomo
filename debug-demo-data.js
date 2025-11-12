const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.development' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Use service role key

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDemo() {
  const demoId = '12345678-1234-1234-1234-123456789012';
  
  console.log('🔍 Checking demo data for:', demoId);
  
  // First, let's see what demos exist
  console.log('📋 Listing all demos...');
  const { data: allDemos, error: listError } = await supabase
    .from('demos')
    .select('id, name, created_at')
    .limit(10);
  
  if (listError) {
    console.error('❌ Error listing demos:', listError);
  } else {
    console.log(`✅ Found ${allDemos?.length || 0} demos:`);
    allDemos?.forEach(demo => {
      console.log(`  - ${demo.id}: ${demo.name} (${demo.created_at})`);
    });
  }
  
  try {
    const { data: demoData, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .single();
    
    if (demoError) {
      console.error('❌ Demo error:', demoError);
      return;
    }
    
    if (!demoData) {
      console.error('❌ Demo not found');
      return;
    }
    
    console.log('✅ Demo found:', {
      id: demoData.id,
      name: demoData.name,
      created_at: demoData.created_at,
      metadata: demoData.metadata
    });
    
    // Check videos
    const { data: videoData, error: videoError } = await supabase
      .from('demo_videos')
      .select('*')
      .eq('demo_id', demoId);
    
    if (videoError) {
      console.warn('⚠️ Video error:', videoError);
    } else {
      console.log(`✅ Found ${videoData?.length || 0} videos`);
    }
    
    // Check knowledge chunks
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_chunks')
      .select('*')
      .eq('demo_id', demoId);
    
    if (knowledgeError) {
      console.warn('⚠️ Knowledge error:', knowledgeError);
    } else {
      console.log(`✅ Found ${knowledgeData?.length || 0} knowledge chunks`);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkDemo();