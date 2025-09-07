/**
 * Manual guardrails testing script
 * Run with: npx tsx src/tests/test-guardrails.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createGuardrailsManager } from '../lib/tavus/guardrails-manager';
import { ALL_GUARDRAIL_TEMPLATES } from '../lib/tavus/guardrails-templates';

async function testTavusGuardrails() {
  console.log('🔍 Testing Tavus Guardrails Integration...\n');
  
  try {
    const manager = createGuardrailsManager();
    
    // Test getting all guardrails
    console.log('📋 Fetching all guardrails...');
    const allGuardrails = await manager.getAllGuardrails();
    console.log(`✅ Found ${allGuardrails.data.length} guardrails sets`);
    
    allGuardrails.data.forEach(g => {
      console.log(`  • ${g.name} (${g.uuid})`);
    });
    
    // Test finding Domo AI guardrails
    console.log('\n🔍 Looking for Domo AI guardrails...');
    const domoGuardrails = await manager.findGuardrailsByName(ALL_GUARDRAIL_TEMPLATES.DOMO_AI_GUARDRAILS.name);
    
    if (domoGuardrails) {
      console.log(`✅ Found Domo AI guardrails: ${domoGuardrails.uuid}`);
      
      // Test getting specific guardrails details
      const details = await manager.getGuardrails(domoGuardrails.uuid);
      console.log(`✅ Retrieved guardrails details: ${details.name}`);
    } else {
      console.log('⚠️  Domo AI guardrails not found - run setup script first');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Tavus guardrails test failed:', error);
    return false;
  }
}

function testGuardrailsTemplates() {
  console.log('\n🔍 Testing Guardrails Templates...\n');
  
  const templates = ALL_GUARDRAIL_TEMPLATES;
  let allPassed = true;
  
  Object.entries(templates).forEach(([key, template]) => {
    console.log(`📋 Testing ${key}:`);
    console.log(`  • Name: ${template.name}`);
    console.log(`  • Rules: ${template.data.length}`);
    
    template.data.forEach((rule, index) => {
      const hasName = !!rule.guardrail_name;
      const hasPrompt = !!rule.guardrail_prompt;
      const hasModality = !!rule.modality;
      
      console.log(`    ${index + 1}. ${rule.guardrail_name}: ${hasName && hasPrompt && hasModality ? '✅' : '❌'}`);
      
      if (!hasName || !hasPrompt || !hasModality) {
        allPassed = false;
      }
    });
  });
  
  return allPassed;
}

function testSystemPromptClean() {
  console.log('\n🔍 Testing Clean System Prompt...\n');
  
  const cleanPromptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt_clean.md');
  
  if (!fs.existsSync(cleanPromptPath)) {
    console.error('❌ Clean system prompt file not found!');
    return false;
  }
  
  const content = fs.readFileSync(cleanPromptPath, 'utf-8');
  
  // Check that guardrails section is removed
  const hasGuardrailsSection = /## GUARDRAILS \(Critical\)/.test(content);
  const hasNote = /Behavioral guardrails are enforced separately/.test(content);
  
  console.log(`${hasGuardrailsSection ? '❌' : '✅'} Guardrails section removed: ${!hasGuardrailsSection}`);
  console.log(`${hasNote ? '✅' : '❌'} Guardrails note present: ${hasNote}`);
  
  console.log(`\n📊 Clean System Prompt Stats:`);
  console.log(`- Total length: ${content.length} characters`);
  console.log(`- Lines: ${content.split('\n').length}`);
  
  return !hasGuardrailsSection && hasNote;
}

function testFileStructure() {
  console.log('\n🔍 Testing File Structure...\n');
  
  const files = [
    'src/lib/tavus/guardrails-templates.ts',
    'src/lib/tavus/guardrails-manager.ts',
    'src/lib/tavus/persona-with-guardrails.ts',
    'src/lib/tavus/system_prompt_clean.md',
    'scripts/setup-guardrails.ts'
  ];
  
  let allFound = true;
  
  files.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`);
    if (!exists) allFound = false;
  });
  
  return allFound;
}

// Run tests
async function runAllTests() {
  console.log('🚀 Guardrails Integration Test Suite\n');
  
  const templatesOk = testGuardrailsTemplates();
  const cleanPromptOk = testSystemPromptClean();
  const filesOk = testFileStructure();
  const tavusOk = await testTavusGuardrails();
  
  const allPassed = templatesOk && cleanPromptOk && filesOk && tavusOk;
  
  console.log(`\n${allPassed ? '✅' : '❌'} Overall Status: ${allPassed ? 'PASS' : 'FAIL'}`);
  
  if (!allPassed) {
    console.log('\n💡 Next steps:');
    if (!filesOk) console.log('- Ensure all guardrails files are created');
    if (!templatesOk) console.log('- Fix guardrails template validation errors');
    if (!cleanPromptOk) console.log('- Update system prompt to remove embedded guardrails');
    if (!tavusOk) console.log('- Run: npx tsx scripts/setup-guardrails.ts');
    
    process.exit(1);
  }
  
  console.log('\n🎉 All tests passed! Your guardrails are properly set up.');
}

if (require.main === module) {
  runAllTests();
}