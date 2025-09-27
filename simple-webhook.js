#!/usr/bin/env node

// Simple webhook manager - just run this when you need webhooks
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function updateWebhook(webhookUrl) {
  try {
    console.log('🔄 Updating webhook URL in database...');
    
    const { data: objectives, error } = await supabase
      .from('custom_objectives')
      .select('*')
      .eq('name', 'Workday Sales Demo Flow')
      .eq('is_active', true);
    
    if (error || !objectives || objectives.length === 0) {
      console.log('❌ Custom objective not found');
      return false;
    }
    
    const objective = objectives[0];
    const updatedObjectives = objective.objectives.map(obj => {
      if (obj.objective_name === 'greeting_and_qualification') {
        return { ...obj, callback_url: `${webhookUrl}/api/webhook/qualification` };
      }
      return obj;
    });
    
    await supabase
      .from('custom_objectives')
      .update({ 
        objectives: updatedObjectives,
        updated_at: new Date().toISOString()
      })
      .eq('id', objective.id);
    
    console.log('✅ Webhook URL updated in database');
    console.log(`📡 Webhook: ${webhookUrl}/api/webhook/qualification`);
    return true;
  } catch (error) {
    console.log(`❌ Update failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Simple Webhook Manager\n');
  
  // Kill existing localtunnel
  exec('pkill -f "lt --port"', () => {});
  
  console.log('🌐 Starting localtunnel...');
  console.log('   This will give you a new webhook URL');
  console.log('   Keep this terminal open!\n');
  
  const subdomain = `workday-demo-${Date.now()}`;
  const webhookUrl = `https://${subdomain}.loca.lt`;
  
  // Start localtunnel
  const lt = exec(`lt --port 3000 --subdomain ${subdomain}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Localtunnel error: ${error.message}`);
    }
  });
  
  // Wait a moment then update webhook
  setTimeout(async () => {
    await updateWebhook(webhookUrl);
    
    console.log('\n🎉 Setup complete!');
    console.log('📋 Next steps:');
    console.log('   1. Create NEW agent (to use updated webhook)');
    console.log('   2. Test qualification flow');
    console.log('   3. Check: http://localhost:3000/api/qualification-data');
    console.log('\n⚠️  Keep this terminal open for webhooks to work!');
    console.log('   Press Ctrl+C to stop');
  }, 5000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping webhook manager...');
    lt.kill();
    process.exit(0);
  });
}

main();