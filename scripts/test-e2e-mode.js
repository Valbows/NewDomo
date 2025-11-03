#!/usr/bin/env node

/**
 * Quick test to verify E2E mode is working
 */

console.log('🧪 Testing E2E Mode Configuration');
console.log('=================================\n');

console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_E2E_TEST_MODE:', process.env.NEXT_PUBLIC_E2E_TEST_MODE);
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...');

console.log('\n🎯 Manual Testing Steps:');
console.log('========================');
console.log('1. Open browser to: http://localhost:3000');
console.log('2. Navigate to any demo configure page');
console.log('3. Click "View Demo Experience" button');
console.log('4. Should navigate to experience page');
console.log('5. Should show E2E stub data instead of "Connecting..."');

console.log('\n✅ Expected Results in E2E Mode:');
console.log('================================');
console.log('- No "Connecting..." screen');
console.log('- Shows "E2E Demo" as demo name');
console.log('- Shows conversation interface with stub data');
console.log('- No Tavus/Daily.co connection attempts');

console.log('\n🔍 If you see issues:');
console.log('=====================');
console.log('- Check browser console for "E2E mode" messages');
console.log('- Verify NEXT_PUBLIC_E2E_TEST_MODE=true in browser DevTools');
console.log('- Look for "Using E2E stub data" in console');

console.log('\n🚀 Test URLs:');
console.log('=============');
console.log('Configure page: http://localhost:3000/demos/any-demo-id/configure');
console.log('Experience page: http://localhost:3000/demos/any-demo-id/experience');
console.log('Experience with E2E: http://localhost:3000/demos/any-demo-id/experience?e2e=true');

console.log('\n💡 Pro Tip: Use any demo ID - E2E mode will work with any ID!');