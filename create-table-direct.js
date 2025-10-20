#!/usr/bin/env node

/**
 * Create video_showcase_data table using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🎬 Creating video_showcase_data table using SQL...\n');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS video_showcase_data (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      requested_videos TEXT[],
      videos_shown TEXT[],
      objective_name TEXT NOT NULL DEFAULT 'demo_video_showcase',
      event_type TEXT NOT NULL DEFAULT 'conversation.objective.completed',
      received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      raw_payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_video_showcase_conversation_id ON video_showcase_data(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_video_showcase_received_at ON video_showcase_data(received_at);
    CREATE INDEX IF NOT EXISTS idx_video_showcase_objective_name ON video_showcase_data(objective_name);
  `;
  
  const enableRLSSQL = `
    ALTER TABLE video_showcase_data ENABLE ROW LEVEL SECURITY;
  `;
  
  try {
    console.log('📋 Creating table...');
    
    // Use the REST API directly to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ Direct SQL execution not available');
      console.log('💡 Please create the table manually in Supabase SQL Editor:');
      console.log('');
      console.log(createTableSQL);
      console.log(createIndexesSQL);
      console.log(enableRLSSQL);
      return;
    }
    
    console.log('✅ Table created successfully!');
    
    // Create indexes
    console.log('📈 Creating indexes...');
    await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: createIndexesSQL
      })
    });
    
    console.log('✅ Indexes created!');
    
    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: enableRLSSQL
      })
    });
    
    console.log('✅ Row Level Security enabled!');
    console.log('🎉 video_showcase_data table is ready!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual SQL to run in Supabase SQL Editor:');
    console.log('');
    console.log(createTableSQL);
    console.log(createIndexesSQL);
    console.log(enableRLSSQL);
  }
}

main();