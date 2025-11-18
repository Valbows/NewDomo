#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(url, serviceKey);

(async () => {
  console.log('\n🔐 Checking RLS Policies...\n');
  console.log('='.repeat(70));

  // Query pg_policies to see RLS policies
  const { data: policies, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('demos', 'demo_videos')
        ORDER BY tablename, policyname;
      `
    });

  if (error) {
    console.log('❌ Could not query policies (RPC may not exist)');
    console.log('   Trying alternative method...\n');

    // Alternative: Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('demos')
      .select('id')
      .limit(1);

    if (rlsError) {
      console.log('📋 RLS appears to be ENABLED and BLOCKING access');
      console.log('   Error:', rlsError.message);
      console.log('   Code:', rlsError.code);
    }
  } else if (policies) {
    console.log(`\n📋 Found ${policies.length} RLS policies:\n`);
    policies.forEach(p => {
      console.log(`Table: ${p.tablename}`);
      console.log(`  Policy: ${p.policyname}`);
      console.log(`  Command: ${p.cmd}`);
      console.log(`  Roles: ${p.roles?.join(', ')}`);
      console.log(`  Using: ${p.qual || 'N/A'}`);
      console.log('');
    });
  }

  // Test with anon key
  console.log('='.repeat(70));
  console.log('\n🔑 Testing with ANON KEY (what frontend uses):\n');

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonSupabase = createClient(url, anonKey);

  const { data: anonDemos, error: anonError } = await anonSupabase
    .from('demos')
    .select('id, name')
    .limit(5);

  if (anonError) {
    console.log('❌ ANON access BLOCKED by RLS');
    console.log('   Error:', anonError.message);
    console.log('   Code:', anonError.code);

    if (anonError.code === 'PGRST301' || anonError.message.includes('RLS')) {
      console.log('\n💡 RLS policies are preventing public access to demos table');
    }
  } else {
    console.log(`✅ ANON can access ${anonDemos?.length || 0} demos`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 SOLUTION: Update RLS policies to allow public read access,');
  console.log('   or implement authentication in the frontend.\n');
})();
