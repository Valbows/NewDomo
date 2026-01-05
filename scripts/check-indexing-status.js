require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const { TwelvelabsApiClient } = require('twelvelabs-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const client = new TwelvelabsApiClient({ apiKey: process.env.TWELVE_LABS_API_KEY });

async function checkStatus() {
  console.log('🔍 Checking Twelve Labs indexing status...\n');

  // Get all videos with Twelve Labs metadata
  const { data: videos, error } = await supabase
    .from('demo_videos')
    .select('id, title, metadata')
    .not('metadata->twelvelabs', 'is', null);

  if (error || !videos || videos.length === 0) {
    console.log('No videos with Twelve Labs metadata found.');
    return;
  }

  let ready = 0;
  let processing = 0;
  let failed = 0;

  for (const video of videos) {
    const taskId = video.metadata?.twelvelabs?.taskId;
    if (!taskId) continue;

    try {
      const task = await client.tasks.retrieve(taskId);
      const status = task.status;

      const icon = status === 'ready' ? '✅' : status === 'failed' ? '❌' : '⏳';
      console.log(`${icon} ${video.title}`);
      console.log(`   Status: ${status}`);
      if (task.videoId) console.log(`   Video ID: ${task.videoId}`);

      // Update DB with current status and videoId
      if (status === 'ready' || status === 'failed') {
        await supabase
          .from('demo_videos')
          .update({
            metadata: {
              ...video.metadata,
              twelvelabs: {
                ...video.metadata.twelvelabs,
                videoId: task.videoId,
                status: status
              }
            }
          })
          .eq('id', video.id);
      }

      if (status === 'ready') ready++;
      else if (status === 'failed') failed++;
      else processing++;

    } catch (err) {
      console.log(`❓ ${video.title}: Error checking status - ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Ready: ${ready}`);
  console.log(`   Processing: ${processing}`);
  console.log(`   Failed: ${failed}`);

  if (processing > 0) {
    console.log('\n⏳ Some videos are still processing. Run this script again in a few minutes.');
  } else if (ready > 0) {
    console.log('\n✅ All indexing complete! Run: node scripts/generate-video-context.js');
  }
}

checkStatus();
