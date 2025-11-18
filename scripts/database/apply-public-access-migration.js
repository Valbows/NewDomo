#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.log('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

(async () => {
  console.log('\n🔧 Applying public access migration...\n');

  // Read the migration SQL
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20251117000000_allow_public_demo_access.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
      // Try alternative method if RPC doesn't exist
      console.log('   ⚠️  RPC failed, trying direct execution...');

      // For policy creation, we need to use raw SQL
      try {
        const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ query: statement })
        });

        if (!res.ok) {
          console.log(`   ❌ Failed: ${await res.text()}`);
        } else {
          console.log('   ✅ Success (via HTTP)');
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        console.log('\n💡 Please run this SQL manually in your Supabase SQL Editor:\n');
        console.log(sql);
        console.log('\n');
        process.exit(1);
      }
    } else {
      console.log('   ✅ Success');
    }
  }

  console.log('\n🎉 Migration applied! Testing access...\n');

  // Test with anon key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonSupabase = createClient(url, anonKey);

  const { data, error } = await anonSupabase
    .from('demos')
    .select('id, name')
    .limit(3);

  if (error) {
    console.log('❌ Still blocked:', error.message);
  } else {
    console.log(`✅ Public access working! Found ${data?.length || 0} demos:\n`);
    data?.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.name} (${d.id.slice(0, 8)}...)`);
    });
  }
  console.log('');
})();
