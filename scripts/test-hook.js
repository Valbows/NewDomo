#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function testHookLogic() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  try {
    console.log('🧪 Testing hook logic...');
    
    // Simulate what the hook does
    const userId = 'fc07d4fe-7497-4b92-87b9-0bceadb25c4e'; // From our database check
    
    const { data: demosData, error: demosError } = await supabase
      .from('demos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (demosError) {
      console.error('❌ Database error:', demosError);
      return;
    }

    console.log(`✅ Hook logic works! Found ${demosData.length} demos:`);
    demosData.forEach((demo, index) => {
      console.log(`   ${index + 1}. ${demo.name} (${demo.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testHookLogic();