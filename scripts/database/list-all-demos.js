#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

(async () => {
  console.log('\n📂 Checking all demos in database...\n');
  
  const { data: demos, error } = await supabase
    .from('demos')
    .select('id, name, created_at, status')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (!demos || demos.length === 0) {
    console.log('⚠️  NO DEMOS FOUND IN DATABASE!');
    console.log('\nThis means your database is empty or you are connected to the wrong database.');
    console.log('\nCheck your .env.development file:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  console.log(`✅ Found ${demos.length} demo(s):\n`);
  demos.forEach((demo, i) => {
    console.log(`${i+1}. ${demo.name}`);
    console.log(`   ID: ${demo.id}`);
    console.log(`   Status: ${demo.status}`);
    console.log(`   Created: ${new Date(demo.created_at).toLocaleString()}\n`);
  });
})();
