#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Old Supabase project from .env.backup
const oldUrl = 'https://zewcvwsirjvgknvrmhhk.supabase.co';
const oldKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpld2N2d3Npcmp2Z2tudnJtaGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDY4NDEsImV4cCI6MjA2ODc4Mjg0MX0.MRPsHXx-53yWCa2UFE4l385uiKspENF5jEwd-x0WQ-c';

// Current Supabase project from .env.development
const newUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const newKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTgxODMsImV4cCI6MjA3MjMzNDE4M30.YmVUBMGLCw_2ncKE9nU0lneZi1xCbYspVn7iqjoFhuo';

const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

(async () => {
  console.log('\n🔍 Comparing OLD vs NEW Supabase databases...\n');
  console.log('='.repeat(70));

  // Check OLD database
  console.log('\n📦 OLD Database (zewcvwsirjvgknvrmhhk):');
  console.log('-'.repeat(70));
  const oldSupabase = createClient(oldUrl, oldKey);

  const { data: oldDemo, error: oldDemoError } = await oldSupabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .single();

  if (oldDemoError) {
    console.log(`   ❌ Demo NOT found: ${oldDemoError.message}`);
  } else {
    console.log(`   ✅ DEMO FOUND: "${oldDemo.name}"`);
    console.log(`      Created: ${new Date(oldDemo.created_at).toLocaleString()}`);
    console.log(`      Status: ${oldDemo.status}`);
  }

  const { data: oldVideos } = await oldSupabase
    .from('demo_videos')
    .select('*')
    .eq('demo_id', demoId);

  console.log(`   📹 Videos: ${oldVideos?.length || 0}`);
  if (oldVideos && oldVideos.length > 0) {
    oldVideos.forEach((v, i) => {
      console.log(`      ${i + 1}. "${v.title}"`);
    });
  }

  const { data: allOldDemos } = await oldSupabase
    .from('demos')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   📊 Total demos in OLD database: ${allOldDemos?.length || 0}`);

  // Check NEW database
  console.log('\n📦 NEW Database (xddjudwawavxwirpkksz):');
  console.log('-'.repeat(70));
  const newSupabase = createClient(newUrl, newKey);

  const { data: newDemo, error: newDemoError } = await newSupabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .single();

  if (newDemoError) {
    console.log(`   ❌ Demo NOT found: ${newDemoError.message}`);
  } else {
    console.log(`   ✅ DEMO FOUND: "${newDemo.name}"`);
  }

  const { data: newVideos } = await newSupabase
    .from('demo_videos')
    .select('*')
    .eq('demo_id', demoId);

  console.log(`   📹 Videos: ${newVideos?.length || 0}`);

  const { data: allNewDemos } = await newSupabase
    .from('demos')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   📊 Total demos in NEW database: ${allNewDemos?.length || 0}`);

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 DIAGNOSIS:');
  if (oldDemo && !newDemo) {
    console.log('   🎯 ROOT CAUSE IDENTIFIED:');
    console.log('      - Demo exists in OLD database (zewcvwsirjvgknvrmhhk)');
    console.log('      - Demo does NOT exist in NEW database (xddjudwawavxwirpkksz)');
    console.log('      - Browser has cached data from old database');
    console.log('\n   📋 SOLUTION OPTIONS:');
    console.log('      1. Migrate data from old database to new database');
    console.log('      2. Switch back to old database in .env files');
    console.log('      3. Create new demo in current database');
  } else if (!oldDemo && !newDemo) {
    console.log('   ❌ Demo not found in either database');
  } else if (newDemo) {
    console.log('   ✅ Demo exists in new database (unexpected!)');
  }
  console.log('');
})();
