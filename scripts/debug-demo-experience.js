#!/usr/bin/env node

/**
 * Debug script for Demo Experience page issues
 * Helps identify where the "Connecting..." gets stuck
 */

import { execSync } from 'child_process';

console.log('🔍 Demo Experience Debug Helper');
console.log('===============================\n');

console.log('📋 Common Issues & Debugging Steps:');
console.log('===================================\n');

console.log('1. 🔗 Navigation Working (✅ Based on your screenshot)');
console.log('   - Button successfully navigates to experience page');
console.log('   - Page loads and shows "Connecting..." state\n');

console.log('2. 🚨 Stuck at "Connecting..." - Possible Causes:');
console.log('   a) Missing Supabase environment variables');
console.log('   b) Demo not found in database');
console.log('   c) Missing or invalid tavusShareableLink in demo metadata');
console.log('   d) Invalid Daily.co room URL format');
console.log('   e) Network/CORS issues with Tavus/Daily.co\n');

console.log('3. 🛠️ Debugging Steps:');
console.log('========================\n');

console.log('Step 1: Check Browser Console');
console.log('-----------------------------');
console.log('Open DevTools (F12) and check Console tab for:');
console.log('- Supabase connection errors');
console.log('- Demo fetch errors');
console.log('- Tavus/Daily.co connection errors');
console.log('- CORS errors\n');

console.log('Step 2: Check Network Tab');
console.log('-------------------------');
console.log('Look for failed requests to:');
console.log('- Supabase API calls');
console.log('- Daily.co room connections');
console.log('- Any 404, 500, or CORS errors\n');

console.log('Step 3: Add Debug Logging');
console.log('-------------------------');
console.log('Add these console.log statements to your experience page:\n');

const debugCode = `
// Add to fetchDemoAndStartConversation function:
console.log('🔍 Debug: Starting demo fetch for ID:', demoId);
console.log('🔍 Debug: E2E mode:', isE2E);

// After Supabase demo fetch:
console.log('🔍 Debug: Demo data:', demoData);
console.log('🔍 Debug: Demo error:', demoError);

// In startConversation function:
console.log('🔍 Debug: Demo metadata:', demoData.metadata);
console.log('🔍 Debug: Tavus shareable link:', demoData.metadata?.tavusShareableLink);
console.log('🔍 Debug: Is valid Daily URL:', isDailyRoomUrl(shareableLink));
console.log('🔍 Debug: Setting conversation URL:', shareableLink);
`;

console.log(debugCode);

console.log('Step 4: Check Environment Variables');
console.log('-----------------------------------');
console.log('Verify these are set in .env.development:');
console.log('- NEXT_PUBLIC_SUPABASE_URL');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('- Any Tavus/Daily.co related variables\n');

console.log('Step 5: Database Verification');
console.log('-----------------------------');
console.log('Check if your demo exists in Supabase:');
console.log('1. Go to Supabase dashboard');
console.log('2. Check "demos" table');
console.log('3. Verify demo ID exists');
console.log('4. Check metadata.tavusShareableLink is valid\n');

console.log('Step 6: Test with E2E Mode');
console.log('---------------------------');
console.log('Add ?e2e=true to URL to test with stub data:');
console.log('http://localhost:3000/demos/your-demo-id/experience?e2e=true\n');

console.log('🔧 Quick Fixes to Try:');
console.log('======================\n');

console.log('1. Enable E2E mode temporarily:');
console.log('   Add NEXT_PUBLIC_E2E_TEST_MODE=true to .env.development\n');

console.log('2. Check if demo exists:');
console.log('   Replace "your-demo-id" with actual demo ID from URL\n');

console.log('3. Verify Supabase connection:');
console.log('   Test with a simple Supabase query in browser console\n');

console.log('📊 Next Steps Based on Console Output:');
console.log('======================================\n');

console.log('If you see "Demo not found":');
console.log('- Check demo ID in URL matches database');
console.log('- Verify Supabase connection\n');

console.log('If you see "Demo not configured with Tavus conversation":');
console.log('- Check demo.metadata.tavusShareableLink exists');
console.log('- Verify it\'s a valid Daily.co URL\n');

console.log('If you see "Invalid conversation URL format":');
console.log('- Check tavusShareableLink format');
console.log('- Should match: https://[domain].daily.co/[room]\n');

console.log('If no errors but still stuck:');
console.log('- Check Network tab for failed requests');
console.log('- Look for CORS or connection issues');
console.log('- Try different browser/incognito mode\n');

console.log('🚀 Run this for more specific debugging:');
console.log('=======================================');
console.log('node scripts/debug-demo-experience.js --check-env');
console.log('node scripts/debug-demo-experience.js --test-supabase');
console.log('node scripts/debug-demo-experience.js --validate-demo <demo-id>\n');

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--check-env')) {
  console.log('🔍 Environment Check:');
  console.log('=====================');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_E2E_TEST_MODE'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${envVar}: Not set`);
    }
  });
}

if (args.includes('--test-supabase')) {
  console.log('🔍 Supabase Connection Test:');
  console.log('============================');
  console.log('Add this to your browser console on the experience page:');
  console.log(`
// Test Supabase connection
import { supabase } from '@/lib/supabase';
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('demos').select('id').limit(1);
    console.log('Supabase test result:', { data, error });
  } catch (e) {
    console.error('Supabase connection failed:', e);
  }
};
testConnection();
  `);
}

if (args.includes('--validate-demo')) {
  const demoId = args[args.indexOf('--validate-demo') + 1];
  if (demoId) {
    console.log(`🔍 Demo Validation for ID: ${demoId}`);
    console.log('=====================================');
    console.log('Add this to your browser console:');
    console.log(`
// Validate specific demo
import { supabase } from '@/lib/supabase';
const validateDemo = async () => {
  try {
    const { data, error } = await supabase
      .from('demos')
      .select('*')
      .eq('id', '${demoId}')
      .single();
    
    console.log('Demo data:', data);
    console.log('Demo error:', error);
    
    if (data?.metadata?.tavusShareableLink) {
      console.log('Tavus link:', data.metadata.tavusShareableLink);
      console.log('Is valid Daily URL:', /^https?:\\/\\/[a-z0-9.-]+\\.daily\\.co\\/.+/i.test(data.metadata.tavusShareableLink));
    } else {
      console.log('❌ No tavusShareableLink found in metadata');
    }
  } catch (e) {
    console.error('Demo validation failed:', e);
  }
};
validateDemo();
    `);
  } else {
    console.log('❌ Please provide demo ID: --validate-demo <demo-id>');
  }
}

console.log('\n💡 Pro Tip: Check the browser DevTools Console and Network tabs first!');
console.log('Most issues will show up there with specific error messages.\n');