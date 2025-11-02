#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.development' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing envs: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
  console.log('🎬 Seeding E2E test videos...');

  const demoId = '42beb287-f385-4100-86a4-bfe7008d531b';
  
  // Test videos for E2E testing
  const testVideos = [
    {
      demo_id: demoId,
      title: 'E2E Test Video',
      storage_url: 'test-videos/e2e-test-video.mp4',
      order_index: 1,
      duration_seconds: 30,
      transcript: 'This is a test video for E2E testing.',
      processing_status: 'completed'
    },
    {
      demo_id: demoId,
      title: 'Strategic Planning',
      storage_url: 'test-videos/strategic-planning.mp4',
      order_index: 2,
      duration_seconds: 45,
      transcript: 'This video covers strategic planning concepts.',
      processing_status: 'completed'
    },
    {
      demo_id: demoId,
      title: 'Product Demo',
      storage_url: 'test-videos/product-demo.mp4',
      order_index: 3,
      duration_seconds: 60,
      transcript: 'This is a product demonstration video.',
      processing_status: 'completed'
    }
  ];

  // Clear existing test videos for this demo
  const deleteResult = await admin
    .from('demo_videos')
    .delete()
    .eq('demo_id', demoId);
  
  if (deleteResult.error) {
    console.warn('⚠️  Could not clear existing videos:', deleteResult.error.message);
  } else {
    console.log('🗑️  Cleared existing test videos');
  }

  // Insert test videos
  for (const video of testVideos) {
    const result = await admin
      .from('demo_videos')
      .insert(video);
    
    if (result.error) {
      console.error(`❌ Failed to insert video "${video.title}":`, result.error.message);
    } else {
      console.log(`✅ Inserted video: ${video.title}`);
    }
  }

  // Update demo to have proper CTA configuration
  const ctaConfig = {
    cta_title: 'Try Pro',
    cta_message: 'Unlock features',
    cta_button_text: 'Start Free Trial',
    cta_button_url: 'https://example.com/trial'
  };

  const updateDemo = await admin
    .from('demos')
    .update(ctaConfig)
    .eq('id', demoId);

  if (updateDemo.error) {
    console.error('❌ Failed to update demo CTA config:', updateDemo.error.message);
  } else {
    console.log('✅ Updated demo CTA configuration');
  }

  console.log('🎉 E2E video seed complete!');
  console.log('📋 Test videos available:');
  testVideos.forEach(video => {
    console.log(`   - ${video.title} (${video.storage_path})`);
  });
  
})().catch((e) => {
  console.error('❌ Video seed failed:', e);
  process.exit(1);
});