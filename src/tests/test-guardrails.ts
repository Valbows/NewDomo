/**
 * Manual guardrails testing script
 * Run with: npx tsx src/tests/test-guardrails.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function testSystemPromptIntegrity() {
  console.log('🔍 Testing System Prompt Guardrails...\n');
  
  const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
  
  if (!fs.existsSync(promptPath)) {
    console.error('❌ System prompt file not found!');
    return false;
  }
  
  const content = fs.readFileSync(promptPath, 'utf-8');
  
  // Check for critical guardrails sections
  const checks = [
    {
      name: 'Guardrails Section',
      pattern: /## GUARDRAILS \(Critical\)/,
      required: true
    },
    {
      name: 'Tool Call Verbalization Rule',
      pattern: /Do NOT verbalize tool calls/,
      required: true
    },
    {
      name: 'Exact Title Requirement',
      pattern: /Exact Title Required/,
      required: true
    },
    {
      name: 'Sensitive Topics Rule',
      pattern: /Sensitive Topics.*refuse.*race.*gender.*politics.*religion/s,
      required: true
    },
    {
      name: 'No Parroting Rule',
      pattern: /No Parroting.*User Echoes/,
      required: true
    },
    {
      name: 'Repeat After Me Rule',
      pattern: /Handle "repeat after me"/,
      required: true
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const found = check.pattern.test(content);
    const status = found ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${found ? 'Found' : 'Missing'}`);
    
    if (check.required && !found) {
      allPassed = false;
    }
  });
  
  console.log(`\n📊 System Prompt Stats:`);
  console.log(`- Total length: ${content.length} characters`);
  console.log(`- Lines: ${content.split('\n').length}`);
  
  return allPassed;
}

function testWebhookValidation() {
  console.log('\n🔍 Testing Webhook Validation Logic...\n');
  
  // This would require importing the actual validation functions
  // For now, just check if the files exist
  const files = [
    'src/app/api/tavus-webhook/handler.ts',
    'src/lib/security/webhooks.ts'
  ];
  
  files.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`);
  });
}

// Run tests
console.log('🚀 Guardrails Integrity Check\n');
const promptOk = testSystemPromptIntegrity();
testWebhookValidation();

console.log(`\n${promptOk ? '✅' : '❌'} Overall Status: ${promptOk ? 'PASS' : 'FAIL'}`);

if (!promptOk) {
  process.exit(1);
}