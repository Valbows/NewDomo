#!/usr/bin/env node

// Enhanced webhook manager with ngrok support and multiple objectives
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function updateWebhooks(webhookUrl) {
  try {
    console.log('🔄 Updating webhook URLs in database...');
    
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
      // Update qualification webhook
      if (obj.objective_name === 'greeting_and_qualification') {
        return { ...obj, callback_url: `${webhookUrl}/api/webhooks/events/qualification` };
      }
      // Update product interest webhook
      if (obj.objective_name === 'product_interest_discovery') {
        return { ...obj, callback_url: `${webhookUrl}/api/webhooks/events/product-interest` };
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
    
    console.log('✅ Webhook URLs updated in database');
    console.log(`📡 Qualification: ${webhookUrl}/api/webhooks/events/qualification`);
    console.log(`📡 Product Interest: ${webhookUrl}/api/webhooks/events/product-interest`);
    
    // Save webhook URL to .env.local for persistence
    updateEnvFile(webhookUrl);
    
    return true;
  } catch (error) {
    console.log(`❌ Update failed: ${error.message}`);
    return false;
  }
}

function updateEnvFile(webhookUrl) {
  try {
    const envPath = '.env.local';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Remove existing NGROK_URL and NEXT_PUBLIC_BASE_URL lines
    const lines = envContent.split('\n').filter(line => 
      !line.startsWith('NGROK_URL=') && 
      !line.startsWith('NEXT_PUBLIC_BASE_URL=')
    );
    
    // Add new URLs
    lines.push(`NGROK_URL=${webhookUrl}`);
    lines.push(`NEXT_PUBLIC_BASE_URL=${webhookUrl}`);
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('💾 Webhook URLs saved to .env.local');
    console.log(`   NGROK_URL=${webhookUrl}`);
    console.log(`   NEXT_PUBLIC_BASE_URL=${webhookUrl}`);
  } catch (error) {
    console.log(`⚠️  Could not save to .env.local: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Enhanced Webhook Manager\n');
  
  // Kill existing tunnels
  exec('pkill -f "ngrok\\|lt --port"', () => {});
  
  console.log('🌐 Starting ngrok tunnel...');
  console.log('   This will give you a stable webhook URL');
  console.log('   Keep this terminal open!\n');
  
  // Try ngrok first, fallback to localtunnel
  const useNgrok = false; // Set to false to use localtunnel
  
  if (useNgrok) {
    // Start ngrok
    const ngrok = exec('ngrok http 3000 --log=stdout', (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Ngrok error: ${error.message}`);
        console.log('💡 Install ngrok: npm install -g ngrok');
        console.log('💡 Or use localtunnel by setting useNgrok = false');
      }
    });
    
    // Parse ngrok output to get URL
    ngrok.stdout.on('data', (data) => {
      const output = data.toString();
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
      if (urlMatch) {
        const webhookUrl = urlMatch[0];
        console.log(`✅ Ngrok tunnel established: ${webhookUrl}`);
        updateWebhooks(webhookUrl);
        
        console.log('\n🎉 Setup complete!');
        console.log('📋 Next steps:');
        console.log('   1. Create NEW agent (to use updated webhooks)');
        console.log('   2. Test qualification flow');
        console.log('   3. Test product interest flow');
        console.log('   4. Check data:');
        console.log('      - http://localhost:3000/api/qualification-data');
        console.log('      - http://localhost:3000/api/product-interest-data');
        console.log('\n⚠️  Keep this terminal open for webhooks to work!');
        console.log('   Press Ctrl+C to stop');
      }
    });
  } else {
    // Fallback to localtunnel
    const subdomain = `workday-demo-${Date.now()}`;
    const webhookUrl = `https://${subdomain}.loca.lt`;
    
    const lt = exec(`lt --port 3000 --subdomain ${subdomain}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Localtunnel error: ${error.message}`);
      }
    });
    
    setTimeout(async () => {
      await updateWebhooks(webhookUrl);
      
      console.log('\n🎉 Setup complete!');
      console.log('📋 Next steps:');
      console.log('   1. Create NEW agent (to use updated webhooks)');
      console.log('   2. Test both objectives');
      console.log('   3. Check data endpoints');
      console.log('\n⚠️  Keep this terminal open for webhooks to work!');
    }, 5000);
  }
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping webhook manager...');
    exec('pkill -f "ngrok\\|lt --port"', () => {});
    process.exit(0);
  });
}

main();