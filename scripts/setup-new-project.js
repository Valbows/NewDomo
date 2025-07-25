#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// This script will be run AFTER you create a new Supabase project
// and update the environment variables

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please update .env.local with your new Supabase project credentials first!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupNewProject() {
  console.log('🚀 Setting up new Supabase project...');
  console.log(`🔗 Project URL: ${supabaseUrl}`);
  
  try {
    // 1. Create database schema
    console.log('\n📊 Creating database schema...');
    
    const schemaSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create demos table
      CREATE TABLE IF NOT EXISTS public.demos (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        name TEXT NOT NULL,
        script TEXT,
        user_id UUID NOT NULL,
        video_url TEXT,
        video_storage_path TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        upload_id UUID DEFAULT uuid_generate_v4()
      );
      
      -- Create index on user_id for performance
      CREATE INDEX IF NOT EXISTS demos_user_id_idx ON public.demos(user_id);
      
      -- Create index on upload_id for uniqueness
      CREATE UNIQUE INDEX IF NOT EXISTS demos_upload_id_idx ON public.demos(upload_id);
      
      -- Enable RLS
      ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      CREATE POLICY "Users can view their own demos" ON public.demos
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own demos" ON public.demos
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own demos" ON public.demos
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own demos" ON public.demos
        FOR DELETE USING (auth.uid() = user_id);
    `;
    
    // Execute schema creation
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    if (schemaError) {
      console.log('ℹ️  Schema creation via RPC failed, this is normal. Creating via individual queries...');
      
      // Try creating table directly
      const { error: tableError } = await supabase
        .from('demos')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.message.includes('does not exist')) {
        console.log('📝 Please run the following SQL in your Supabase SQL Editor:');
        console.log('---');
        console.log(schemaSQL);
        console.log('---');
        console.log('Then run this script again.');
        return;
      }
    } else {
      console.log('✅ Database schema created successfully');
    }
    
    // 2. Create storage buckets
    console.log('\n🗂️  Creating storage buckets...');
    
    const buckets = [
      {
        name: 'demo-videos',
        options: {
          public: false,
          allowedMimeTypes: ['video/mp4', 'video/mov', 'video/mkv', 'video/avi', 'video/webm'],
          fileSizeLimit: 500 * 1024 * 1024 // 500MB
        }
      }
    ];
    
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options);
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating bucket '${bucket.name}':`, error);
      } else {
        console.log(`✅ Bucket '${bucket.name}' ready`);
      }
    }
    
    // 3. Set up storage policies
    console.log('\n🔐 Setting up storage policies...');
    
    const storagePolicies = `
      -- Storage policies for demo-videos bucket
      CREATE POLICY "Users can upload their own demo videos" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      
      CREATE POLICY "Users can view their own demo videos" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      
      CREATE POLICY "Users can update their own demo videos" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      
      CREATE POLICY "Users can delete their own demo videos" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'demo-videos' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
    `;
    
    console.log('📝 Please also run the following storage policies in your Supabase SQL Editor:');
    console.log('---');
    console.log(storagePolicies);
    console.log('---');
    
    // 4. Import existing data
    console.log('\n📥 Importing existing data...');
    
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    if (fs.existsSync(exportPath)) {
      const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      
      if (exportData.tables.demos && exportData.tables.demos.length > 0) {
        console.log(`📊 Importing ${exportData.tables.demos.length} demos...`);
        
        const { data, error } = await supabase
          .from('demos')
          .insert(exportData.tables.demos);
        
        if (error) {
          console.error('❌ Error importing demos:', error);
        } else {
          console.log('✅ Demos imported successfully');
        }
      }
    }
    
    // 5. Test storage functionality
    console.log('\n🧪 Testing storage functionality...');
    
    // Create a small test file
    const testContent = 'test file content';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const testPath = 'test/storage-test.txt';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('demo-videos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Storage test failed:', uploadError);
      console.log('🔧 This indicates the storage issue may still exist.');
    } else {
      console.log('✅ Storage test successful!');
      
      // Clean up test file
      await supabase.storage.from('demo-videos').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    }
    
    console.log('\n🎉 New project setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the SQL commands shown above in your Supabase SQL Editor');
    console.log('2. Test video upload functionality');
    console.log('3. If storage test passed, the issue should be resolved!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupNewProject();
