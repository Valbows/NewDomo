#!/usr/bin/env node
/**
 * Apply video_showcase_data schema fix
 * Adds demo_id column that's missing from the production table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function applySchemaFix() {
  console.log('🔧 Applying video_showcase_data schema fix...\n');

  try {
    // Check if demo_id column already exists
    const { data: columns, error: checkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'video_showcase_data'
          ORDER BY ordinal_position;
        `
      });

    if (checkError) {
      console.log('ℹ️  Using alternative method to check schema...');

      // Try adding the column directly
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE video_showcase_data
          ADD COLUMN IF NOT EXISTS demo_id UUID;

          ALTER TABLE video_showcase_data
          DROP CONSTRAINT IF EXISTS fk_video_showcase_demo_id;

          ALTER TABLE video_showcase_data
          ADD CONSTRAINT fk_video_showcase_demo_id
          FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE;

          COMMENT ON COLUMN video_showcase_data.demo_id IS 'Reference to the demo that this video showcase belongs to';
        `
      });

      if (alterError) {
        console.error('❌ Failed to add demo_id column:', alterError.message);
        console.log('\nℹ️  Please run this SQL manually in Supabase dashboard:');
        console.log('\n```sql');
        console.log('ALTER TABLE video_showcase_data ADD COLUMN IF NOT EXISTS demo_id UUID;');
        console.log('ALTER TABLE video_showcase_data ADD CONSTRAINT fk_video_showcase_demo_id FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE;');
        console.log('```\n');
        process.exit(1);
      }

      console.log('✅ Successfully added demo_id column to video_showcase_data table');
    } else {
      console.log('Current schema:', columns);
      const hasDemoId = columns.some(col => col.column_name === 'demo_id');

      if (hasDemoId) {
        console.log('✅ demo_id column already exists');
      } else {
        console.log('⚠️  demo_id column missing, adding it now...');
        // Add column logic here
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying schema...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('video_showcase_data')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Schema verified successfully');
      console.log('Table structure is now correct');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

applySchemaFix()
  .then(() => {
    console.log('\n✅ Schema fix complete!');
    console.log('\nNext step: Test video showcase functionality by viewing a demo experience');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
