#!/usr/bin/env node

// Simple Node.js script to manage webhook tunnel
require('dotenv').config({ path: '.env.local' });
const { spawn, exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

let tunnelProcess = null;
let currentUrl = null;

function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function cleanup() {
  if (tunnelProcess) {
    tunnelProcess.kill();
    tunnelProcess = null;
  }
  
  // Kill any existing localtunnel processes
  exec('pkill -f "lt --port"', () => {});
}

async function updateWebhookInDatabase(webhookUrl) {
  try {
    log('🔄 Updating webhook URL in database...');
    
    const { data: objectives, error } = await supabase
      .from('custom_objectives')
      .select('*')
      .eq('name', 'Workday Sales Demo Flow')
      .eq('is_active', true);
    
    if (error || !objectives || objectives.length === 0) {
      log('❌ Custom objective not found');
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
    
    log('✅ Webhook URL updated in database');
    return true;
  } catch (error) {
    log(`❌ Database update failed: ${error.message}`);
    return false;
  }
}

async function startTunnel() {
  return new Promise((resolve, reject) => {
    cleanup();
    
    const subdomain = `workday-demo-${Date.now()}`;
    log(`🌐 Starting localtunnel: ${subdomain}`);
    
    tunnelProcess = spawn('lt', ['--port', '3000', '--subdomain', subdomain], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    
    tunnelProcess.stdout.on('data', (data) => {
      output += data.toString();
      const match = output.match(/your url is: (https:\/\/[^\s]+)/);
      if (match) {
        currentUrl = match[1];
        log(`✅ Tunnel established: ${currentUrl}`);
        resolve(currentUrl);
      }
    });
    
    tunnelProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('your url is:')) {
        const match = error.match(/your url is: (https:\/\/[^\s]+)/);
        if (match) {
          currentUrl = match[1];
          log(`✅ Tunnel established: ${currentUrl}`);
          resolve(currentUrl);
        }
      } else {
        log(`⚠️  Tunnel stderr: ${error.trim()}`);
      }
    });
    
    tunnelProcess.on('exit', (code) => {
      log(`❌ Tunnel exited with code: ${code}`);
      tunnelProcess = null;
      currentUrl = null;
      
      // Auto-restart after 5 seconds
      setTimeout(() => {
        log('🔄 Auto-restarting tunnel...');
        startTunnel().then(updateWebhookInDatabase);
      }, 5000);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!currentUrl) {
        reject(new Error('Tunnel startup timeout'));
      }
    }, 30000);
  });
}

async function main() {
  log('🚀 Starting webhook tunnel manager...');
  
  try {
    const url = await startTunnel();
    await updateWebhookInDatabase(url);
    
    log('🎉 Webhook setup complete!');
    log(`📡 Webhook URL: ${url}/api/webhook/qualification`);
    log('📊 Check data: http://localhost:3000/api/qualification-data');
    log('');
    log('⚠️  Keep this process running for webhooks to work');
    log('   Press Ctrl+C to stop');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  log('🛑 Shutting down webhook manager...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Shutting down webhook manager...');
  cleanup();
  process.exit(0);
});

// Start the manager
main();