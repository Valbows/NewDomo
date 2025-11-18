#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

console.log('\n🔐 Checking database with SERVICE ROLE (bypasses RLS)...\n');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

console.log('URL:', url);
console.log('Service Key:', serviceKey ? `${serviceKey.slice(0, 20)}...` : 'NOT SET');

if (!url || !serviceKey) {
  console.log('❌ Missing credentials\n');
  process.exit(1);
}

// Create client with SERVICE ROLE key (bypasses RLS)
const supabase = createClient(url, serviceKey);

const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

(async () => {
  console.log('='.repeat(70));

  // Check all demos
  console.log('\n📂 All demos in database:');
  const { data: allDemos, error: allError, count } = await supabase
    .from('demos')
    .select('*', { count: 'exact' });

  if (allError) {
    console.log('   ❌ Error:', allError.message);
    console.log('   Code:', allError.code);
    console.log('   Details:', allError.details);
    console.log('   Hint:', allError.hint);
  } else {
    console.log(`   ✅ Found ${count} demo(s) total`);
    if (allDemos && allDemos.length > 0) {
      allDemos.slice(0, 5).forEach((d, i) => {
        console.log(`   ${i + 1}. "${d.name}" (${d.id})`);
      });
    }
  }

  // Check specific demo
  console.log(`\n🎯 Looking for demo: ${demoId}`);
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .maybeSingle();

  if (demoError) {
    console.log('   ❌ Error:', demoError.message);
  } else if (!demo) {
    console.log('   ❌ Demo not found in database');
  } else {
    console.log(`   ✅ Demo found: "${demo.name}"`);
    console.log(`      Created: ${demo.created_at}`);
    console.log(`      Status: ${demo.status}`);
  }

  // Check all videos
  console.log('\n📹 All videos in database:');
  const { data: allVideos, error: videoError, count: videoCount } = await supabase
    .from('demo_videos')
    .select('*', { count: 'exact' });

  if (videoError) {
    console.log('   ❌ Error:', videoError.message);
  } else {
    console.log(`   ✅ Found ${videoCount} video(s) total`);
    if (allVideos && allVideos.length > 0) {
      allVideos.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i + 1}. "${v.title}" (demo: ${v.demo_id.slice(0, 8)}...)`);
      });
    }
  }

  // Check if tables exist
  console.log('\n🗂️  Checking table structure:');
  const { data: tables, error: tableError } = await supabase
    .from('demos')
    .select('id')
    .limit(0);

  if (tableError) {
    if (tableError.code === '42P01') {
      console.log('   ❌ Table "demos" does NOT exist!');
    } else {
      console.log('   ❌ Error checking table:', tableError.message);
    }
  } else {
    console.log('   ✅ Table "demos" exists');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Using SERVICE ROLE key bypasses all RLS policies.');
  console.log('   If data still not found, the database is truly empty.\n');
})();
