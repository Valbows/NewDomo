#!/usr/bin/env node

/**
 * Check what demo videos are available in the database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🎬 Checking demo videos in database...\n');
  
  try {
    // Get all demos first
    const { data: demos, error: demosError } = await supabase
      .from('demos')
      .select('id, name, user_id')
      .order('created_at', { ascending: false });
    
    if (demosError) {
      throw new Error(`Failed to fetch demos: ${demosError.message}`);
    }
    
    console.log(`📋 Found ${demos?.length || 0} demos:`);
    
    if (!demos || demos.length === 0) {
      console.log('⚠️ No demos found in database');
      return;
    }
    
    for (const demo of demos) {
      console.log(`\n🎯 Demo: ${demo.name} (ID: ${demo.id})`);
      
      // Get videos for this demo
      const { data: videos, error: videosError } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('demo_id', demo.id)
        .order('order_index');
      
      if (videosError) {
        console.log(`   ❌ Error fetching videos: ${videosError.message}`);
        continue;
      }
      
      if (!videos || videos.length === 0) {
        console.log('   📹 No videos uploaded');
        continue;
      }
      
      console.log(`   📹 Videos (${videos.length}):`);
      videos.forEach((video, index) => {
        console.log(`      ${index + 1}. "${video.title}"`);
        console.log(`         - Storage URL: ${video.storage_url}`);
        console.log(`         - Status: ${video.status || 'unknown'}`);
        console.log(`         - Order: ${video.order_index || 'not set'}`);
      });
    }
    
    // Check if there are any videos at all
    const { data: allVideos, error: allVideosError } = await supabase
      .from('demo_videos')
      .select('demo_id, title, storage_url, status')
      .order('created_at', { ascending: false });
    
    if (allVideosError) {
      console.log(`\n❌ Error fetching all videos: ${allVideosError.message}`);
    } else {
      console.log(`\n📊 Total videos in database: ${allVideos?.length || 0}`);
      
      if (allVideos && allVideos.length > 0) {
        console.log('\n🎬 All video titles available:');
        const uniqueTitles = [...new Set(allVideos.map(v => v.title))];
        uniqueTitles.forEach((title, index) => {
          console.log(`   ${index + 1}. "${title}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();