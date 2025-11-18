#!/usr/bin/env node
/**
 * List all videos for a specific demo to debug video fetching issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function listDemoVideos(demoId) {
  console.log(`\n📹 Fetching videos for demo: ${demoId}\n`);

  const { data, error } = await supabase
    .from('demo_videos')
    .select('id, title, storage_url, created_at')
    .eq('demo_id', demoId)
    .order('title');

  if (error) {
    console.error('❌ Error fetching videos:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No videos found for this demo.');
    return;
  }

  console.log(`✅ Found ${data.length} video(s):\n`);
  data.forEach((video, index) => {
    console.log(`${index + 1}. "${video.title}"`);
    console.log(`   URL: ${video.storage_url}`);
    console.log(`   Created: ${new Date(video.created_at).toLocaleString()}\n`);
  });

  console.log(`\n💡 Copy these exact titles when configuring the agent's tools.\n`);
}

// Get demo ID from command line or use default
const demoId = process.argv[2] || '8cc16f2d-b407-4895-9639-643d1a976da4';
listDemoVideos(demoId).then(() => process.exit(0));
