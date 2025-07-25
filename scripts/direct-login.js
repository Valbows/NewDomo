#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create client with anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function directLogin() {
  console.log('🔐 Logging in as test user...');
  
  const testEmail = 'test@domo-ai.com';
  const testPassword = 'testpassword123';
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ Login failed:', error);
      return;
    }

    console.log('✅ Login successful!');
    console.log('📋 Session Details:');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Access Token: ${data.session.access_token.substring(0, 30)}...`);
    console.log(`   Expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    console.log('\n🎯 Ready for Testing:');
    console.log('The user is now authenticated. You can:');
    console.log('1. Go to http://localhost:3000/demos/create');
    console.log('2. Test video upload functionality');
    console.log('3. The authentication should work automatically');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

directLogin();
