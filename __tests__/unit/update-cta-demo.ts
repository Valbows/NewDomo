/**
 * Update CTA Demo Script
 * 
 * This script updates the CTA configuration for a specific demo directly in Supabase.
 * It adds the CTA fields to the metadata JSON object.
 * 
 * Usage:
 * npx tsx -r dotenv/config __tests__/unit/update-cta-demo.ts dotenv_config_path=.env.local
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo ID to update - change this to your demo ID
const DEMO_ID = '3412ac55-43cd-4500-b1ba-9732b34f9ef9';

// CTA configuration to add
const CTA_CONFIG = {
  ctaTitle: 'Ready to Get Started?',
  ctaMessage: 'Start your free trial today and see the difference!',
  ctaButtonText: 'Start Free Trial',
  ctaButtonUrl: 'https://bolt.new'
};

async function updateDemoCTA() {
  console.log(`🔄 Updating CTA for demo ${DEMO_ID}...`);
  
  // First, fetch the current demo data
  const { data: demo, error: fetchError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', DEMO_ID)
    .single();
  
  if (fetchError) {
    console.error('❌ Error fetching demo:', fetchError);
    return;
  }
  
  if (!demo) {
    console.error(`❌ Demo with ID ${DEMO_ID} not found`);
    return;
  }
  
  console.log('📊 Current demo metadata:', demo.metadata);
  
  // Parse metadata if it's a string
  let currentMetadata = demo.metadata;
  if (typeof currentMetadata === 'string') {
    try {
      currentMetadata = JSON.parse(currentMetadata);
    } catch (e) {
      console.error('❌ Failed to parse metadata string:', e);
      currentMetadata = {};
    }
  }
  
  // Ensure metadata is an object
  if (!currentMetadata || typeof currentMetadata !== 'object') {
    currentMetadata = {};
  }
  
  // Merge the CTA config with existing metadata
  const updatedMetadata = {
    ...currentMetadata,
    ...CTA_CONFIG
  };
  
  console.log('📝 New metadata to save:', updatedMetadata);
  
  // Update the demo with new metadata
  const { error: updateError } = await supabase
    .from('demos')
    .update({
      metadata: updatedMetadata
    })
    .eq('id', DEMO_ID);
  
  if (updateError) {
    console.error('❌ Error updating demo:', updateError);
    return;
  }
  
  console.log('✅ CTA configuration updated successfully!');
  console.log('🔗 CTA Button URL set to:', CTA_CONFIG.ctaButtonUrl);
  
  // Verify the update
  const { data: updatedDemo, error: verifyError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', DEMO_ID)
    .single();
  
  if (verifyError) {
    console.error('❌ Error verifying update:', verifyError);
    return;
  }
  
  console.log('✅ Verification successful!');
  console.log('📊 Updated demo metadata:', updatedDemo.metadata);
}

// Run the update function
updateDemoCTA().catch(console.error);