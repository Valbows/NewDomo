const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDemo() {
  const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

  const { data, error } = await supabase
    .from('demos')
    .select('id, name, tavus_conversation_id, metadata')
    .eq('id', demoId)
    .single();

  if (error) {
    console.error('Error fetching demo:', error);
    return;
  }

  console.log('Demo data:');
  console.log(JSON.stringify(data, null, 2));

  if (data.metadata) {
    console.log('\nMetadata:');
    const metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
    console.log(JSON.stringify(metadata, null, 2));
  }
}

checkDemo();
