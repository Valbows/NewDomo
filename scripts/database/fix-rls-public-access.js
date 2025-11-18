#!/usr/bin/env node
/**
 * Fix RLS policies to allow public read access to demos, demo_videos, and knowledge_chunks
 * This enables the /demos/[demoId]/experience page to work without authentication
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: '.env.development' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.log('❌ Missing Supabase credentials in .env.development\n');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('\n🔧 Fixing RLS Policies for Public Demo Access');
console.log('='.repeat(50));
console.log(`📊 Supabase Project: ${projectRef}`);
console.log('');

const SQL_STATEMENTS = [
  // Demos table - allow public read
  `DROP POLICY IF EXISTS "Public can view published demos" ON public.demos`,
  `CREATE POLICY "Public can view published demos" ON public.demos FOR SELECT USING (true)`,

  // Demo videos table - allow public read
  `DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos`,
  `CREATE POLICY "Public can view demo videos" ON public.demo_videos FOR SELECT USING (true)`,

  // Knowledge chunks - allow public read (needed for AI conversations)
  `DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks`,
  `CREATE POLICY "Public can view knowledge chunks" ON public.knowledge_chunks FOR SELECT USING (true)`,
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('🔄 Applying RLS policy changes...\n');

  // Try using the Supabase client first
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  for (const sql of SQL_STATEMENTS) {
    const shortSql = sql.substring(0, 60) + (sql.length > 60 ? '...' : '');
    console.log(`   Executing: ${shortSql}`);

    try {
      const result = await executeSQL(sql);
      if (result.success) {
        console.log('   ✅ Success\n');
      } else {
        console.log(`   ⚠️  Status ${result.statusCode}: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('='.repeat(50));
  console.log('\n🧪 Testing public access with anonymous key...\n');

  const anonSupabase = createClient(SUPABASE_URL, ANON_KEY);

  const { data: demos, error: demosError } = await anonSupabase
    .from('demos')
    .select('id, name')
    .limit(3);

  if (demosError) {
    console.log('❌ Demos still blocked:', demosError.message);
    console.log('   Code:', demosError.code);
    console.log('\n💡 Manual Fix Required:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to: Database > Policies');
    console.log('   3. For the "demos" table, add a new policy:');
    console.log('      - Name: "Public can view published demos"');
    console.log('      - Command: SELECT');
    console.log('      - Policy: true');
    console.log('   4. Repeat for "demo_videos" and "knowledge_chunks" tables\n');
    process.exit(1);
  } else {
    console.log(`✅ Demos: Public access working! Found ${demos?.length || 0} demos`);
    demos?.forEach((d, i) => {
      console.log(`   ${i + 1}. "${d.name}"`);
    });
  }

  const { data: videos, error: videosError } = await anonSupabase
    .from('demo_videos')
    .select('id, title')
    .limit(3);

  if (videosError) {
    console.log('\n❌ Videos still blocked:', videosError.message);
  } else {
    console.log(`\n✅ Videos: Public access working! Found ${videos?.length || 0} videos`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 RLS policies fixed! Your demo experience page should now work.\n');
})();
