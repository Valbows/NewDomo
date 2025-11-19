#!/usr/bin/env node
/**
 * Diagnostic script to check RLS security issue
 * Shows what policies are active and what data would be visible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function checkRLSIssue() {
  console.log('🔍 RLS SECURITY DIAGNOSTIC');
  console.log('=' .repeat(80));

  // Note: Skipping direct policy query as it requires special permissions
  console.log('\n📋 KNOWN RLS POLICIES ON demos TABLE:\n');
  console.log('Based on migrations, these policies exist:');
  console.log('  1. "Users can view their own demos" - FOR SELECT USING (auth.uid() = user_id)');
  console.log('  2. "Public can view published demos" - FOR SELECT USING (true) ← PROBLEM');
  console.log('  3. "Users can insert their own demos" - FOR INSERT WITH CHECK (auth.uid() = user_id)');
  console.log('  4. "Users can update their own demos" - FOR UPDATE USING (auth.uid() = user_id)');
  console.log('  5. "Users can delete their own demos" - FOR DELETE USING (auth.uid() = user_id)');

  // Count total demos in database
  console.log('\n\n📊 TOTAL DEMOS IN DATABASE:\n');
  const { data: allDemos, error: allDemosError } = await supabase
    .from('demos')
    .select('id, user_id, name, created_at', { count: 'exact' });

  if (allDemosError) {
    console.error('Error:', allDemosError);
  } else {
    console.log(`Total demos: ${allDemos?.length || 0}`);

    // Group by user
    const demosByUser = {};
    allDemos?.forEach(demo => {
      if (!demosByUser[demo.user_id]) {
        demosByUser[demo.user_id] = [];
      }
      demosByUser[demo.user_id].push(demo);
    });

    console.log(`\nDemos grouped by user_id:`);
    Object.entries(demosByUser).forEach(([userId, demos]) => {
      console.log(`\n  User: ${userId.substring(0, 8)}...`);
      console.log(`  Demos: ${demos.length}`);
      demos.forEach((demo, idx) => {
        console.log(`    ${idx + 1}. ${demo.name} (created: ${demo.created_at})`);
      });
    });
  }

  // Test what an unauthenticated user would see
  console.log('\n\n⚠️  WHAT AN UNAUTHENTICATED USER CAN SEE:\n');

  // Create an unauthenticated client
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: anonDemos, error: anonError } = await anonClient
    .from('demos')
    .select('id, name, user_id');

  if (anonError) {
    console.error('Error:', anonError);
  } else {
    console.log(`❌ SECURITY BREACH: Unauthenticated users can see ${anonDemos?.length || 0} demos!`);
    if (anonDemos && anonDemos.length > 0) {
      console.log('\nExample demos visible to anonymous users:');
      anonDemos.slice(0, 5).forEach((demo, idx) => {
        console.log(`  ${idx + 1}. ${demo.name} (user: ${demo.user_id.substring(0, 8)}...)`);
      });
      if (anonDemos.length > 5) {
        console.log(`  ... and ${anonDemos.length - 5} more`);
      }
    }
  }

  console.log('\n\n🔐 RLS POLICY ANALYSIS:\n');
  console.log('Current situation:');
  console.log('  ✅ Policy: "Users can view their own demos" (auth.uid() = user_id)');
  console.log('  ❌ Policy: "Public can view published demos" (true) <- THIS IS THE PROBLEM');
  console.log('');
  console.log('PostgreSQL RLS uses OR logic for SELECT policies.');
  console.log('Since "Public can view published demos" always returns true,');
  console.log('ALL demos are visible to EVERYONE (authenticated or not).');
  console.log('');
  console.log('This was added in migration 20251117000000_allow_public_demo_access.sql');
  console.log('to allow demo sharing, but it\'s too permissive.');

  console.log('\n\n💡 SOLUTION OPTIONS:\n');
  console.log('1. Add a "is_public" boolean column to demos table');
  console.log('   Change policy to: USING (is_public = true OR user_id = auth.uid())');
  console.log('');
  console.log('2. Use a separate "public_demos" table for shareable demos');
  console.log('');
  console.log('3. Remove the public policy and require demo_id in URL');
  console.log('   Keep strict RLS, allow access only with valid demo_id link');

  console.log('\n' + '='.repeat(80));
}

checkRLSIssue()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
