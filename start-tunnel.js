#!/usr/bin/env node
/**
 * Simple tunnel starter with multiple fallback options
 */

const { exec } = require('child_process');

console.log('🌐 Starting tunnel with fallback options...\n');

// Try different tunnel services in order
const tunnelOptions = [
  {
    name: 'ngrok',
    command: 'ngrok http 3000',
    check: 'which ngrok',
    install: 'Install: brew install ngrok/ngrok/ngrok (or npm install -g ngrok)'
  },
  {
    name: 'cloudflared',
    command: 'cloudflared tunnel --url http://localhost:3000',
    check: 'which cloudflared',
    install: 'Install: brew install cloudflared'
  },
  {
    name: 'serveo',
    command: 'ssh -R 80:localhost:3000 serveo.net',
    check: 'which ssh',
    install: 'SSH should be available by default'
  }
];

async function tryTunnel(option) {
  return new Promise((resolve) => {
    console.log(`🔍 Checking ${option.name}...`);
    
    exec(option.check, (error) => {
      if (error) {
        console.log(`❌ ${option.name} not available`);
        console.log(`   ${option.install}\n`);
        resolve(false);
        return;
      }
      
      console.log(`✅ ${option.name} found! Starting tunnel...`);
      console.log(`   Command: ${option.command}\n`);
      
      const tunnel = exec(option.command);
      
      tunnel.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      tunnel.stderr.on('data', (data) => {
        console.log(data.toString());
      });
      
      tunnel.on('close', (code) => {
        console.log(`${option.name} tunnel closed with code ${code}`);
      });
      
      resolve(true);
    });
  });
}

async function main() {
  console.log('Available tunnel options:\n');
  
  for (const option of tunnelOptions) {
    const success = await tryTunnel(option);
    if (success) {
      console.log(`\n🎉 ${option.name} tunnel started!`);
      console.log('Keep this terminal open for webhooks to work.');
      console.log('Press Ctrl+C to stop the tunnel.\n');
      
      // Handle shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping tunnel...');
        process.exit(0);
      });
      
      return;
    }
  }
  
  console.log('❌ No tunnel services available.');
  console.log('\n💡 Alternative: Deploy to a cloud service for stable webhooks:');
  console.log('   - Vercel: vercel --prod');
  console.log('   - Railway: railway up');
  console.log('   - Render: git push to deploy');
}

main();