const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCtaTable() {
  try {
    // Create the table with individual queries
    const queries = [
      `CREATE TABLE IF NOT EXISTS cta_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        demo_id UUID NOT NULL,
        cta_shown_at TIMESTAMP WITH TIME ZONE,
        cta_clicked_at TIMESTAMP WITH TIME ZONE,
        cta_url TEXT,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE INDEX IF NOT EXISTS idx_cta_tracking_conversation_id ON cta_tracking(conversation_id);`,
      `CREATE INDEX IF NOT EXISTS idx_cta_tracking_demo_id ON cta_tracking(demo_id);`,
      `CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_shown_at ON cta_tracking(cta_shown_at);`,
      `CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_clicked_at ON cta_tracking(cta_clicked_at);`,
      
      `ALTER TABLE cta_tracking ENABLE ROW LEVEL SECURITY;`,
      
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cta_tracking' AND policyname = 'Allow all operations on cta_tracking') THEN
           CREATE POLICY "Allow all operations on cta_tracking" ON cta_tracking FOR ALL USING (true);
         END IF;
       END $$;`
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        console.error('Error executing query:', query.substring(0, 50) + '...', error);
      } else {
        console.log('✅ Executed:', query.substring(0, 50) + '...');
      }
    }
    
    console.log('🎉 CTA tracking table setup completed!');
  } catch (err) {
    console.error('Error:', err);
  }
}

createCtaTable();