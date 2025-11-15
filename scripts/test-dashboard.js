#!/usr/bin/env node

// Simple script to test if the dashboard would show demos
// This simulates what the useDemosRealtime hook should do

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function testDashboardLogic() {
  console.log('🧪 Testing dashboard logic...');
  
  // Simulate authentication (we'll use a known user ID from our database check)
  const mockUser = {
    id: 'fc07d4fe-7497-4b92-87b9-0bceadb25c4e' // From our database check
  };
  
  console.log(`👤 Simulating user: ${mockUser.id}`);
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
  
  try {
    // This is exactly what the hook should do
    const { data: demosData, error: demosError } = await supabase
      .from('demos')
      .select('*')
      .eq('user_id', mockUser.id)
      .order('created_at', { ascending: false });

    if (demosError) {
      console.error('❌ Database error:', demosError);
      console.log('🔍 Dashboard would show: ERROR STATE');
      return;
    }

    console.log(`✅ Database query successful! Found ${demosData.length} demos`);
    
    if (demosData.length === 0) {
      console.log('📝 Dashboard would show: EMPTY STATE (No demos yet)');
    } else {
      console.log('🎉 Dashboard would show: DEMO LIST');
      console.log('📊 Summary statistics:');
      console.log(`   - Total Demos: ${demosData.length}`);
      
      const activeDemos = demosData.filter(d => d.tavus_persona_id || d.tavus_conversation_id);
      console.log(`   - Active Demos: ${activeDemos.length}`);
      
      let totalConversations = 0;
      demosData.forEach(demo => {
        const analytics = demo.metadata?.analytics;
        if (analytics?.conversations) {
          totalConversations += Object.keys(analytics.conversations).length;
        }
      });
      console.log(`   - Total Conversations: ${totalConversations}`);
      
      console.log('\n📋 Demo List:');
      demosData.forEach((demo, index) => {
        console.log(`   ${index + 1}. ${demo.name}`);
        console.log(`      Created: ${new Date(demo.created_at).toLocaleDateString()}`);
        console.log(`      Status: ${demo.tavus_persona_id || demo.tavus_conversation_id ? 'Active' : 'Draft'}`);
      });
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (demosData.length > 0) {
      console.log('✅ Dashboard should show demos, NOT empty state');
      console.log('✅ If dashboard shows empty state, the hook is broken');
    } else {
      console.log('📝 Dashboard should show empty state (user has no demos)');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('🔍 Dashboard would show: ERROR STATE');
  }
}

testDashboardLogic();