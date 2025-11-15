// Load environment variables from .env.development for testing
const fs = require('fs');
const path = require('path');

// Load .env.development if it exists
const envPath = path.join(__dirname, '.env.development');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_E2E_TEST_MODE = 'false';