#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function checkAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔍 Checking authentication...');
    
    // Try to get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 User needs to log in to see their demos');
      return;
    }

    console.log('✅ Active session found:');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    console.log(`   Session expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);

    // Check demos for this user
    const { data: demos, error: demosError } = await supabase
      .from('demos')
      .select('*')
      .eq('user_id', session.user.id);

    if (demosError) {
      console.error('❌ Error fetching user demos:', demosError);
    } else {
      console.log(`\n📊 Found ${demos.length} demos for current user:`);
      demos.forEach((demo, index) => {
        console.log(`   ${index + 1}. ${demo.name} (${demo.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAuth();