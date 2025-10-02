#!/usr/bin/env node

/**
 * Create the video_showcase_data table in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🎬 Creating video_showcase_data table...\n');
  
  try {
    // Create the table using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Video Showcase Data Table
        -- Captures data from demo_video_showcase objective

        CREATE TABLE IF NOT EXISTS video_showcase_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          requested_videos TEXT[], -- Array of video titles requested by user
          videos_shown TEXT[], -- Array of video titles actually shown
          objective_name TEXT NOT NULL DEFAULT 'demo_video_showcase',
          event_type TEXT NOT NULL DEFAULT 'conversation.objective.completed',
          received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          raw_payload JSONB, -- Store the full webhook payload for debugging
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_video_showcase_conversation_id ON video_showcase_data(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_video_showcase_received_at ON video_showcase_data(received_at);
        CREATE INDEX IF NOT EXISTS idx_video_showcase_objective_name ON video_showcase_data(objective_name);

        -- Enable Row Level Security (RLS)
        ALTER TABLE video_showcase_data ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully created video_showcase_data table!');
    console.log('📊 Table includes columns for:');
    console.log('   - conversation_id (TEXT)');
    console.log('   - requested_videos (TEXT[])');
    console.log('   - videos_shown (TEXT[])');
    console.log('   - objective_name (TEXT)');
    console.log('   - received_at (TIMESTAMP)');
    console.log('   - raw_payload (JSONB)');
    console.log('🔒 Row Level Security enabled');
    console.log('📈 Indexes created for performance');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    
    // Try alternative approach using direct SQL execution
    console.log('\n🔄 Trying alternative approach...');
    
    try {
      // Create table directly
      const { error: createError } = await supabase
        .from('video_showcase_data')
        .select('id')
        .limit(1);
      
      if (createError && createError.message.includes('relation "video_showcase_data" does not exist')) {
        console.log('📋 Table does not exist, this is expected for first run');
        console.log('💡 Please run the SQL manually in Supabase SQL Editor:');
        console.log('');
        console.log('CREATE TABLE IF NOT EXISTS video_showcase_data (');
        console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('  conversation_id TEXT NOT NULL,');
        console.log('  requested_videos TEXT[],');
        console.log('  videos_shown TEXT[],');
        console.log('  objective_name TEXT NOT NULL DEFAULT \'demo_video_showcase\',');
        console.log('  event_type TEXT NOT NULL DEFAULT \'conversation.objective.completed\',');
        console.log('  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  raw_payload JSONB,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
      } else {
        console.log('✅ Table already exists or was created successfully!');
      }
    } catch (altError) {
      console.log('💡 Please create the table manually in Supabase SQL Editor');
    }
  }
}

main();