#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔑 Testing ANONYMOUS access (what frontend uses):\n');

const supabase = createClient(url, anonKey);

const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

(async () => {
  // Test 1: Get specific demo
  console.log(`1. Fetching specific demo: ${demoId.slice(0, 8)}...`);
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .maybeSingle();

  if (demoError) {
    console.log('   ❌ Error:', demoError.message);
    console.log('   Code:', demoError.code);
  } else if (!demo) {
    console.log('   ⚠️  No demo found (RLS filtering it out)');
  } else {
    console.log('   ✅ Demo found:', demo.name);
  }

  // Test 2: Get all demos
  console.log('\n2. Fetching all demos:');
  const { data: allDemos, error: allError, count } = await supabase
    .from('demos')
    .select('*', { count: 'exact' });

  if (allError) {
    console.log('   ❌ Error:', allError.message);
  } else {
    console.log(`   Found ${count} demos (RLS may be filtering)`);
    if (allDemos && allDemos.length > 0) {
      allDemos.forEach((d, i) => {
        console.log(`   ${i + 1}. "${d.name}"`);
      });
    }
  }

  // Test 3: Get videos for demo
  console.log('\n3. Fetching videos for demo:');
  const { data: videos, error: videoError } = await supabase
    .from('demo_videos')
    .select('*')
    .eq('demo_id', demoId);

  if (videoError) {
    console.log('   ❌ Error:', videoError.message);
  } else {
    console.log(`   Found ${videos?.length || 0} videos`);
    if (videos && videos.length > 0) {
      videos.forEach((v, i) => {
        console.log(`   ${i + 1}. "${v.title}"`);
      });
    }
  }

  console.log('\n💡 If seeing 0 results but no errors, RLS is allowing access');
  console.log('   but filtering results (likely based on auth.uid()).\n');
})();
