#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase Storage buckets...');

  // List existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }

  console.log('📋 Existing buckets:', existingBuckets.map(b => b.name));

  const bucketsToCreate = [
    {
      name: 'demo-videos',
      options: {
        public: false,
        allowedMimeTypes: ['video/mp4', 'video/mov', 'video/mkv', 'video/avi', 'video/webm'],
        fileSizeLimit: 500 * 1024 * 1024 // 500MB
      }
    },
    {
      name: 'test-uploads',
      options: {
        public: false,
        allowedMimeTypes: ['video/mp4', 'video/mov', 'video/mkv', 'video/avi', 'video/webm'],
        fileSizeLimit: 500 * 1024 * 1024 // 500MB
      }
    }
  ];

  for (const bucket of bucketsToCreate) {
    const exists = existingBuckets.some(b => b.name === bucket.name);
    
    if (exists) {
      console.log(`✅ Bucket '${bucket.name}' already exists`);
      continue;
    }

    console.log(`🔧 Creating bucket '${bucket.name}'...`);
    
    const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options);
    
    if (error) {
      console.error(`❌ Error creating bucket '${bucket.name}':`, error);
    } else {
      console.log(`✅ Successfully created bucket '${bucket.name}'`);
    }
  }

  // Set up RLS policies for the buckets
  console.log('🔐 Setting up storage policies...');
  
  const policies = [
    {
      name: 'demo_videos_upload_policy',
      bucket: 'demo-videos',
      sql: `
        CREATE POLICY "Users can upload their own demo videos" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'demo_videos_read_policy', 
      bucket: 'demo-videos',
      sql: `
        CREATE POLICY "Users can read their own demo videos" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'test_uploads_policy',
      bucket: 'test-uploads', 
      sql: `
        CREATE POLICY "Users can manage test uploads" ON storage.objects
        FOR ALL USING (
          bucket_id = 'test-uploads' AND 
          auth.uid() IS NOT NULL
        );
      `
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating policy '${policy.name}':`, error);
      } else {
        console.log(`✅ Policy '${policy.name}' configured`);
      }
    } catch (err) {
      console.log(`ℹ️  Policy '${policy.name}' may already exist or require manual setup`);
    }
  }

  console.log('🎉 Storage setup complete!');
}

setupStorageBuckets().catch(console.error);
