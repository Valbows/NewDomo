#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

(async () => {
  const { data, error } = await supabase
    .from('demo_videos')
    .select('demo_id, title')
    .order('demo_id, title')
    .limit(50);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No videos found in database at all.');
    console.log('\n💡 You need to upload videos via the demo configuration page.');
    return;
  }

  const byDemo = {};
  data.forEach(v => {
    if (!byDemo[v.demo_id]) byDemo[v.demo_id] = [];
    byDemo[v.demo_id].push(v.title);
  });

  console.log(`\n✅ Found ${data.length} videos across ${Object.keys(byDemo).length} demo(s):\n`);
  Object.entries(byDemo).forEach(([demoId, titles]) => {
    console.log(`📁 Demo: ${demoId}`);
    titles.forEach(t => console.log(`   - "${t}"`));
    console.log('');
  });
})();
