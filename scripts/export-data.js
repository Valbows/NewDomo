#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportData() {
  console.log('🚀 Starting data export...');
  
  const exportData = {
    timestamp: new Date().toISOString(),
    oldProject: {
      url: supabaseUrl,
      projectId: supabaseUrl.split('//')[1].split('.')[0]
    },
    tables: {},
    storage: {
      buckets: [],
      files: []
    }
  };

  try {
    // Export users table
    console.log('📊 Exporting users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('ℹ️  Users table not found or empty:', usersError.message);
    } else {
      exportData.tables.users = users;
      console.log(`✅ Exported ${users.length} users`);
    }

    // Export demos table
    console.log('📊 Exporting demos...');
    const { data: demos, error: demosError } = await supabase
      .from('demos')
      .select('*');
    
    if (demosError) {
      console.log('ℹ️  Demos table not found or empty:', demosError.message);
    } else {
      exportData.tables.demos = demos;
      console.log(`✅ Exported ${demos.length} demos`);
    }

    // Export storage buckets
    console.log('🗂️  Exporting storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('ℹ️  Could not list buckets:', bucketsError.message);
    } else {
      exportData.storage.buckets = buckets;
      console.log(`✅ Found ${buckets.length} storage buckets`);
      
      // List files in each bucket
      for (const bucket of buckets) {
        console.log(`📁 Listing files in bucket: ${bucket.name}`);
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (filesError) {
          console.log(`ℹ️  Could not list files in ${bucket.name}:`, filesError.message);
        } else {
          exportData.storage.files.push({
            bucket: bucket.name,
            files: files
          });
          console.log(`✅ Found ${files.length} files in ${bucket.name}`);
        }
      }
    }

    // Save export data
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('🎉 Export complete!');
    console.log(`📄 Data saved to: ${exportPath}`);
    console.log('\n📋 Export Summary:');
    console.log(`- Users: ${exportData.tables.users?.length || 0}`);
    console.log(`- Demos: ${exportData.tables.demos?.length || 0}`);
    console.log(`- Storage Buckets: ${exportData.storage.buckets?.length || 0}`);
    console.log(`- Total Files: ${exportData.storage.files?.reduce((sum, bucket) => sum + bucket.files.length, 0) || 0}`);
    
    // Save current environment variables
    const envBackup = `# Backup of old Supabase project (${new Date().toISOString()})
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}

# Other environment variables
TAVUS_API_KEY=${process.env.TAVUS_API_KEY}
TAVUS_BASE_URL=${process.env.TAVUS_BASE_URL}
ELEVENLABS_API_KEY=${process.env.ELEVENLABS_API_KEY}
ELEVENLABS_URL=${process.env.ELEVENLABS_URL}
`;
    
    const envBackupPath = path.join(__dirname, '..', '.env.backup');
    fs.writeFileSync(envBackupPath, envBackup);
    console.log(`🔐 Environment variables backed up to: ${envBackupPath}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();
