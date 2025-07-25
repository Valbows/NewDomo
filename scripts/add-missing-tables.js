#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingTables() {
  console.log('🚀 Adding missing database tables...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-knowledge-chunks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📊 Creating knowledge_chunks table...');
    console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
    console.log('---');
    console.log(sql);
    console.log('---');
    
    console.log('\n✅ SQL commands prepared!');
    console.log('\n📋 Next Steps:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to your Supabase SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Refresh the configure page');
    console.log('5. The error should be resolved!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

addMissingTables();
