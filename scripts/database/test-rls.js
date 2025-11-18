#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

console.log('\n🔐 Testing Supabase RLS Policies...\n');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', url ? `${url.slice(0, 30)}...` : 'NOT SET');
console.log('Anon Key:', anonKey ? `${anonKey.slice(0, 20)}...` : 'NOT SET');

if (!url || !anonKey) {
  console.log('\n❌ Missing Supabase credentials in .env.development!\n');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

(async () => {
  // Test 1: Try to query demos without auth
  console.log('\n1. Testing unauthenticated access to demos...');
  const { data, error, count } = await supabase
    .from('demos')
    .select('*', { count: 'exact' });
    
  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
    if (error.message.includes('RLS') || error.code === 'PGRST301') {
      console.log('   💡 This looks like an RLS policy blocking access!');
    }
  } else {
    console.log(`   ✅ Success! Found ${count} demo(s)`);
    if (count === 0) {
      console.log('   ⚠️  Database is accessible but empty');
    }
  }
  
  // Test 2: Try to query demo_videos
  console.log('\n2. Testing access to demo_videos table...');
  const { data: videos, error: videoError } = await supabase
    .from('demo_videos')
    .select('*');
    
  if (videoError) {
    console.log('   ❌ Error:', videoError.message);
  } else {
    console.log(`   ✅ Success! Found ${videos?.length || 0} video(s)`);
  }
  
  console.log('');
})();
