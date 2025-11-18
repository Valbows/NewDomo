#!/usr/bin/env node

// Quick webhook setup script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function createProductInterestTable() {
  console.log('📊 Creating product_interest_data table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS product_interest_data (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      objective_name TEXT NOT NULL DEFAULT 'product_interest_discovery',
      primary_interest TEXT,
      pain_points TEXT[],
      event_type TEXT NOT NULL,
      received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      raw_payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_product_interest_conversation_id ON product_interest_data(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_product_interest_received_at ON product_interest_data(received_at);
    CREATE INDEX IF NOT EXISTS idx_product_interest_objective ON product_interest_data(objective_name);

    ALTER TABLE product_interest_data ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "Allow all operations on product_interest_data" ON product_interest_data
      FOR ALL USING (true);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
      console.log('⚠️  Could not create table via RPC, table might already exist');
      console.log('   Run this SQL manually in Supabase dashboard:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Product interest table created successfully');
    }
  } catch (error) {
    console.log('⚠️  Could not create table, run this SQL manually in Supabase dashboard:');
    console.log(createTableSQL);
  }
}

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  try {
    // Check qualification_data table
    const { data: qualData, error: qualError } = await supabase
      .from('qualification_data')
      .select('count')
      .limit(1);
    
    if (qualError) {
      console.log('❌ qualification_data table missing');
    } else {
      console.log('✅ qualification_data table exists');
    }
    
    // Check product_interest_data table
    const { data: prodData, error: prodError } = await supabase
      .from('product_interest_data')
      .select('count')
      .limit(1);
    
    if (prodError) {
      console.log('❌ product_interest_data table missing');
      await createProductInterestTable();
    } else {
      console.log('✅ product_interest_data table exists');
    }
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Webhook Setup Script\n');
  
  await checkTables();
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run ngrok');
  console.log('2. Create a new agent with updated webhooks');
  console.log('3. Test both objectives:');
  console.log('   - greeting_and_qualification');
  console.log('   - product_interest_discovery');
  console.log('\n📊 Check captured data:');
  console.log('   - http://localhost:3000/api/qualification-data');
  console.log('   - http://localhost:3000/api/product-interest-data');
}

main();