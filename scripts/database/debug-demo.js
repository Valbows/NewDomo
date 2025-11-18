#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

(async () => {
  console.log('\n🔍 Comprehensive Debug for Demo:', demoId);
  console.log('='.repeat(60));

  // 1. Check demo exists
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .single();

  if (demoError) {
    console.log('\n❌ Demo not found:', demoError.message);
    return;
  }

  console.log('\n✅ Demo found:', demo.name);
  console.log('   Created:', new Date(demo.created_at).toLocaleString());
  console.log('   Status:', demo.status);
  console.log('   Upload ID:', demo.upload_id);

  // 2. Check videos
  const { data: videos, error: videosError } = await supabase
    .from('demo_videos')
    .select('*')
    .eq('demo_id', demoId);

  console.log('\n📹 Videos for this demo:');
  if (videosError || !videos || videos.length === 0) {
    console.log('   ❌ No videos found (count: 0)');
  } else {
    console.log(`   ✅ Found ${videos.length} video(s):`);
    videos.forEach((v, i) => {
      console.log(`   ${i+1}. "${v.title}"`);
      console.log(`      URL: ${v.storage_url}`);
      console.log(`      Created: ${new Date(v.created_at).toLocaleString()}`);
    });
  }

  // 3. Check ALL demos with videos
  const { data: allDemos } = await supabase
    .from('demos')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📂 Recent demos in database:');
  if (allDemos) {
    for (const d of allDemos) {
      const { data: vids } = await supabase
        .from('demo_videos')
        .select('id')
        .eq('demo_id', d.id);
      console.log(`   - ${d.name} (${d.id.slice(0, 8)}...)`);
      console.log(`     Videos: ${vids?.length || 0}`);
    }
  }

  // 4. Check storage
  const { data: storage, error: storageError } = await supabase
    .storage
    .from('demo-videos')
    .list();

  console.log('\n💾 Storage bucket "demo-videos":');
  if (storageError) {
    console.log('   ❌ Error accessing storage:', storageError.message);
  } else if (!storage || storage.length === 0) {
    console.log('   ⚠️  Storage bucket is empty');
  } else {
    console.log(`   ✅ ${storage.length} file(s) in storage`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 DIAGNOSIS:');
  if (!videos || videos.length === 0) {
    console.log('   ❌ This demo has NO videos uploaded.');
    console.log('   📍 To fix: Upload videos at:');
    console.log(`      /demos/${demoId}/configure?tab=videos`);
  }
  console.log('');
})();
