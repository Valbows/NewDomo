#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🚀 Creating test user with service role...');
  
  const testEmail = 'test@domo-ai.com';
  const testPassword = 'testpassword123';
  
  try {
    // Create user using admin API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: 'Test User',
        created_via: 'service_role'
      }
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('✅ Test user already exists');
        
        // Get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('❌ Error listing users:', listError);
          return;
        }
        
        const existingUser = existingUsers.users.find(u => u.email === testEmail);
        if (existingUser) {
          console.log('📋 Test User Details:');
          console.log(`   Email: ${existingUser.email}`);
          console.log(`   ID: ${existingUser.id}`);
          console.log(`   Created: ${existingUser.created_at}`);
        }
      } else {
        console.error('❌ Error creating user:', createError);
        return;
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log('📋 Test User Details:');
      console.log(`   Email: ${user.user.email}`);
      console.log(`   ID: ${user.user.id}`);
      console.log(`   Created: ${user.user.created_at}`);
    }

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Go to http://localhost:3000/auth/sign-in');
    console.log('2. Use the credentials above to sign in');
    console.log('3. You will be redirected to the dashboard');
    console.log('4. Navigate to "Create Demo" to test video upload');
    
    // Test authentication
    console.log('\n🧪 Testing authentication...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Authentication test failed:', authError);
    } else {
      console.log('✅ Authentication test successful!');
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Access Token: ${authData.session.access_token.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

createTestUser();
