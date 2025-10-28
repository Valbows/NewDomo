/**
 * Helper script to setup a demo with CTA configuration
 * Run this to create/update a demo with proper CTA data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEMO_ID = 'd1f91061-cd63-4ec7-bfff-a37016804e1c';

async function setupDemoWithCTA() {
  console.log('🚀 Setting up demo with CTA configuration...\n');
  
  try {
    // Check if demo exists
    const { data: existingDemo } = await supabase
      .from('demos')
      .select('*')
      .eq('id', DEMO_ID)
      .single();
    
    const ctaConfig = {
      ctaTitle: "Start Your Free Trial Today!",
      ctaMessage: "Experience the power of AI-driven customer interactions",
      ctaButtonText: "Start Free Trial",
      ctaButtonUrl: "https://www.example.com/free-trial"
    };
    
    if (existingDemo) {
      console.log('📝 Updating existing demo with CTA configuration...');
      
      // Merge existing metadata with CTA config
      const updatedMetadata = {
        ...(typeof existingDemo.metadata === 'object' ? existingDemo.metadata : {}),
        ...ctaConfig
      };
      
      const { data, error } = await supabase
        .from('demos')
        .update({ metadata: updatedMetadata })
        .eq('id', DEMO_ID)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating demo:', error);
        return;
      }
      
      console.log('✅ Demo updated successfully!');
      console.log('\n📋 CTA Configuration:');
      console.log(`   Title: ${ctaConfig.ctaTitle}`);
      console.log(`   Message: ${ctaConfig.ctaMessage}`);
      console.log(`   Button Text: ${ctaConfig.ctaButtonText}`);
      console.log(`   Button URL: ${ctaConfig.ctaButtonUrl}`);
      
    } else {
      console.log('📝 Creating new demo with CTA configuration...');
      
      const { data, error } = await supabase
        .from('demos')
        .insert({
          id: DEMO_ID,
          name: 'Test Demo with CTA',
          metadata: ctaConfig,
          // Add other required fields based on your schema
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating demo:', error);
        console.log('\n💡 Tip: Make sure to include all required fields for the demos table');
        return;
      }
      
      console.log('✅ Demo created successfully!');
    }
    
    console.log('\n🌐 Test your demo at:');
    console.log(`   http://localhost:3001/demos/${DEMO_ID}/experience`);
    
    console.log('\n📝 To update CTA configuration:');
    console.log(`   1. Go to http://localhost:3001/demos/${DEMO_ID}/configure`);
    console.log('   2. Navigate to the "Call-to-Action" tab');
    console.log('   3. Update the CTA fields and save');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the setup
setupDemoWithCTA();