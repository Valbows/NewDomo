#!/bin/bash
# Script to fix RLS policies and allow public read access to demos

set -e

echo ""
echo "🔧 Fixing RLS Policies for Public Demo Access"
echo "=============================================="
echo ""

# Load environment variables
source .env.development

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found. Trying Node.js approach..."
    node scripts/database/fix-rls-public-access.js
    exit $?
fi

# Get Supabase connection string
SUPABASE_PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')
DB_PASSWORD=$SUPABASE_SECRET_KEY

echo "📊 Supabase Project: $SUPABASE_PROJECT_REF"
echo ""

# Construct connection string
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
CONNECTION_STRING="postgresql://postgres.${SUPABASE_PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "🔄 Applying RLS policy changes..."
echo ""

# Apply the SQL
psql "$CONNECTION_STRING" << 'EOF'
-- Allow public read access to demos
DROP POLICY IF EXISTS "Public can view published demos" ON public.demos;
CREATE POLICY "Public can view published demos"
  ON public.demos
  FOR SELECT
  USING (true);

-- Allow public read access to demo_videos
DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos;
CREATE POLICY "Public can view demo videos"
  ON public.demo_videos
  FOR SELECT
  USING (true);

-- Allow public read access to knowledge_chunks (needed for AI conversations)
DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Public can view knowledge chunks"
  ON public.knowledge_chunks
  FOR SELECT
  USING (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('demos', 'demo_videos', 'knowledge_chunks')
  AND policyname LIKE '%Public%'
ORDER BY tablename, policyname;
EOF

echo ""
echo "✅ RLS policies updated!"
echo ""
echo "🧪 Testing public access..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('demos')
    .select('id, name')
    .limit(3);

  if (error) {
    console.log('❌ Still blocked:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Public access working! Found', data?.length || 0, 'demos');
    data?.forEach((d, i) => console.log('  ', i+1, d.name));
  }
})();
"

echo ""
echo "🎉 Done!"
echo ""
