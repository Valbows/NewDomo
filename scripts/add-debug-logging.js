#!/usr/bin/env node

/**
 * Adds debug logging to the demo experience page
 * Helps identify where the connection process fails
 */

import fs from 'fs';
import path from 'path';

const EXPERIENCE_PAGE_PATH = 'src/app/demos/[demoId]/experience/page.tsx';

console.log('🔧 Adding Debug Logging to Demo Experience Page');
console.log('===============================================\n');

// Read the current file
let content;
try {
  content = fs.readFileSync(EXPERIENCE_PAGE_PATH, 'utf8');
  console.log('✅ Successfully read experience page file');
} catch (error) {
  console.error('❌ Failed to read experience page:', error.message);
  process.exit(1);
}

// Add debug logging to key points
const debugPatches = [
  {
    search: 'const fetchDemoAndStartConversation = async () => {',
    replace: `const fetchDemoAndStartConversation = async () => {
      console.log('🔍 DEBUG: Starting demo fetch for ID:', demoId);
      console.log('🔍 DEBUG: E2E mode enabled:', isE2E);
      console.log('🔍 DEBUG: Force new conversation:', forceNew);`
  },
  {
    search: 'if (isE2E) {',
    replace: `if (isE2E) {
          console.log('🔍 DEBUG: Using E2E stub data');`
  },
  {
    search: 'const { data: demoData, error: demoError } = await supabase',
    replace: `console.log('🔍 DEBUG: Fetching demo from Supabase...');
        const { data: demoData, error: demoError } = await supabase`
  },
  {
    search: 'if (demoError || !demoData) {',
    replace: `console.log('🔍 DEBUG: Demo fetch result:', { demoData, demoError });
        if (demoError || !demoData) {
          console.error('🔍 DEBUG: Demo fetch failed:', demoError);`
  },
  {
    search: 'setDemo(processedDemoData);',
    replace: `console.log('🔍 DEBUG: Processed demo data:', processedDemoData);
        console.log('🔍 DEBUG: Tavus shareable link:', processedDemoData.metadata?.tavusShareableLink);
        setDemo(processedDemoData);`
  },
  {
    search: 'const startConversation = async (demoData: Demo) => {',
    replace: `const startConversation = async (demoData: Demo) => {
    console.log('🔍 DEBUG: Starting conversation with demo:', demoData.id);
    console.log('🔍 DEBUG: Demo metadata:', demoData.metadata);`
  },
  {
    search: 'if (!demoData.metadata?.tavusShareableLink) {',
    replace: `const shareableLink = demoData.metadata?.tavusShareableLink;
      console.log('🔍 DEBUG: Tavus shareable link:', shareableLink);
      
      if (!shareableLink) {
        console.error('🔍 DEBUG: No tavusShareableLink found in metadata');`
  },
  {
    search: 'if (!isDailyRoomUrl(shareableLink)) {',
    replace: `const isValidUrl = isDailyRoomUrl(shareableLink);
      console.log('🔍 DEBUG: Is valid Daily.co URL:', isValidUrl);
      console.log('🔍 DEBUG: URL format check for:', shareableLink);
      
      if (!isValidUrl) {
        console.error('🔍 DEBUG: Invalid Daily.co URL format');`
  },
  {
    search: 'setConversationUrl(shareableLink);',
    replace: `console.log('🔍 DEBUG: Setting conversation URL:', shareableLink);
      setConversationUrl(shareableLink);`
  },
  {
    search: 'setUiState(UIState.CONVERSATION);',
    replace: `console.log('🔍 DEBUG: Setting UI state to CONVERSATION');
      setUiState(UIState.CONVERSATION);`
  }
];

// Apply patches
let patchedContent = content;
let appliedPatches = 0;

debugPatches.forEach((patch, index) => {
  if (patchedContent.includes(patch.search)) {
    patchedContent = patchedContent.replace(patch.search, patch.replace);
    appliedPatches++;
    console.log(`✅ Applied debug patch ${index + 1}/${debugPatches.length}`);
  } else {
    console.log(`⚠️  Skipped patch ${index + 1}/${debugPatches.length} - pattern not found`);
  }
});

// Create backup
const backupPath = `${EXPERIENCE_PAGE_PATH}.backup`;
try {
  fs.writeFileSync(backupPath, content);
  console.log(`✅ Created backup at: ${backupPath}`);
} catch (error) {
  console.error('❌ Failed to create backup:', error.message);
  process.exit(1);
}

// Write patched file
try {
  fs.writeFileSync(EXPERIENCE_PAGE_PATH, patchedContent);
  console.log(`✅ Applied ${appliedPatches}/${debugPatches.length} debug patches`);
  console.log('✅ Debug logging added to experience page\n');
} catch (error) {
  console.error('❌ Failed to write patched file:', error.message);
  process.exit(1);
}

console.log('🎯 Next Steps:');
console.log('==============');
console.log('1. Refresh your browser on the demo experience page');
console.log('2. Open DevTools Console (F12)');
console.log('3. Look for debug messages starting with "🔍 DEBUG:"');
console.log('4. Share the console output to identify the exact issue\n');

console.log('🔄 To remove debug logging:');
console.log('===========================');
console.log(`cp ${backupPath} ${EXPERIENCE_PAGE_PATH}`);
console.log('# This restores the original file\n');

console.log('📋 What to look for in console:');
console.log('===============================');
console.log('- "Starting demo fetch for ID: [your-demo-id]"');
console.log('- "Demo fetch result: { demoData: ..., demoError: ... }"');
console.log('- "Tavus shareable link: [url or null]"');
console.log('- "Is valid Daily.co URL: true/false"');
console.log('- "Setting UI state to CONVERSATION"');
console.log('');
console.log('If you see an error at any step, that\'s where the issue is!');