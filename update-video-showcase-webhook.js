#!/usr/bin/env node

/**
 * Update the demo_video_showcase objective with the video showcase webhook URL
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🎬 Updating demo_video_showcase webhook URL...\n');
  
  try {
    // Get the current webhook URL from environment
    const webhookUrl = process.env.TUNNEL_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://domo-kelvin-webhook.loca.lt';
    const videoShowcaseWebhookUrl = `${webhookUrl}/api/webhook/video-showcase`;
    
    console.log(`🔗 Using webhook URL: ${videoShowcaseWebhookUrl}`);
    
    // Get the active Workday Sales Demo Flow custom objective
    const { data: customObjectives, error: fetchError } = await supabase
      .from('custom_objectives')
      .select('*')
      .eq('name', 'Workday Sales Demo Flow')
      .eq('is_active', true);
    
    if (fetchError) {
      throw new Error(`Failed to fetch custom objectives: ${fetchError.message}`);
    }
    
    if (!customObjectives || customObjectives.length === 0) {
      console.log('⚠️ No active "Workday Sales Demo Flow" custom objective found');
      console.log('💡 Please create the custom objective first through the UI');
      return;
    }
    
    const customObjective = customObjectives[0];
    console.log(`📋 Found custom objective: ${customObjective.name} (ID: ${customObjective.id})`);
    
    // Parse the current objectives
    let objectives = customObjective.objectives;
    if (typeof objectives === 'string') {
      objectives = JSON.parse(objectives);
    }
    
    console.log(`📊 Current objectives count: ${objectives.length}`);
    
    // Find and update the demo_video_showcase objective
    let updated = false;
    const updatedObjectives = objectives.map(obj => {
      if (obj.objective_name === 'demo_video_showcase') {
        console.log(`🎯 Updating demo_video_showcase objective webhook URL`);
        updated = true;
        return {
          ...obj,
          callback_url: videoShowcaseWebhookUrl
        };
      }
      return obj;
    });
    
    if (!updated) {
      console.log('⚠️ demo_video_showcase objective not found in custom objectives');
      console.log('📋 Available objectives:');
      objectives.forEach(obj => {
        console.log(`   - ${obj.objective_name}`);
      });
      return;
    }
    
    // Update the custom objective in the database
    const { error: updateError } = await supabase
      .from('custom_objectives')
      .update({
        objectives: updatedObjectives,
        updated_at: new Date().toISOString()
      })
      .eq('id', customObjective.id);
    
    if (updateError) {
      throw new Error(`Failed to update custom objective: ${updateError.message}`);
    }
    
    console.log('✅ Successfully updated demo_video_showcase webhook URL!');
    console.log(`🔗 Webhook URL: ${videoShowcaseWebhookUrl}`);
    console.log('💡 The objective will now send video showcase data to the webhook endpoint');
    
  } catch (error) {
    console.error('❌ Error updating webhook URL:', error.message);
    process.exit(1);
  }
}

main();