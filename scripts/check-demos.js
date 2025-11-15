#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function checkDemos() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  try {
    console.log('🔍 Checking demos in database...');
    
    // Get all demos
    const { data: demos, error } = await supabase
      .from('demos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching demos:', error);
      return;
    }

    console.log(`📊 Found ${demos.length} demos in database:`);
    
    if (demos.length === 0) {
      console.log('📝 No demos found. The dashboard will show empty state.');
    } else {
      demos.forEach((demo, index) => {
        console.log(`\n${index + 1}. Demo: ${demo.name}`);
        console.log(`   ID: ${demo.id}`);
        console.log(`   User ID: ${demo.user_id}`);
        console.log(`   Created: ${demo.created_at}`);
        console.log(`   Persona ID: ${demo.tavus_persona_id || 'None'}`);
        console.log(`   Conversation ID: ${demo.tavus_conversation_id || 'None'}`);
      });
    }

    // Check users table to see if there are any users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`\n👥 Found ${users.length} users in database`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDemos();