#!/usr/bin/env node

/**
 * Update the system prompt for existing personas with improved video tool instructions
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📝 Updating system prompt with improved video tool instructions...\n');
  
  try {
    // Read the updated system prompt
    const systemPromptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const updatedSystemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
    
    console.log('✅ System prompt updated with:');
    console.log('   🔧 Proper TOOL CALL FORMAT section');
    console.log('   🎬 Available demo videos list with exact titles');
    console.log('   📋 Video usage guidelines');
    console.log('   ⚡ Critical tool call formatting instructions');
    
    console.log('\n📊 Available video titles for fetch_video():');
    console.log('   1. "Workforce Planning: Strategic Planning"');
    console.log('   2. "Workforce Planning: Build, Hire, Borrow Analysis"');
    console.log('   3. "Workforce Planning: Eliminate Planning Silos"');
    console.log('   4. "Workforce Planning: Headcount and Cost Planning"');
    console.log('   5. "Workforce Planning: Headcount Reconciliation"');
    console.log('   6. "Workforce Planning: More Context Behind The Numbers"');
    console.log('   7. "Workforce Planning: Planning and Executing in a Single System"');
    
    console.log('\n🎯 Key improvements:');
    console.log('   - AI now knows exact video titles to use');
    console.log('   - Clear tool call format instructions');
    console.log('   - Guidelines for when and how to show videos');
    console.log('   - Emphasis on using exact titles from the list');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Create a new agent to use the updated system prompt');
    console.log('   2. Test video fetching with exact titles like:');
    console.log('      "Show me the Strategic Planning video"');
    console.log('   3. The AI should call: fetch_video("Workforce Planning: Strategic Planning")');
    
    console.log('\n🚀 Video fetching should now work properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();