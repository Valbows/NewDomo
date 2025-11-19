#!/usr/bin/env node
/**
 * Debug script to check reporting data in database
 * Helps diagnose why product interest and video showcase data isn't showing in reporting
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function debugReportingData() {
  console.log('🔍 Debugging Reporting Data');
  console.log('=' .repeat(80));

  // 1. Get all conversation_details
  console.log('\n📋 CONVERSATION DETAILS:');
  const { data: conversations, error: convError } = await supabase
    .from('conversation_details')
    .select('id, demo_id, tavus_conversation_id, status, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('❌ Error fetching conversations:', convError);
  } else if (!conversations || conversations.length === 0) {
    console.log('⚠️  No conversations found in conversation_details table');
  } else {
    console.log(`✅ Found ${conversations.length} conversations (showing last 10):`);
    conversations.forEach((conv, idx) => {
      console.log(`\n${idx + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Demo ID: ${conv.demo_id}`);
      console.log(`   Tavus Conversation ID: ${conv.tavus_conversation_id}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Created: ${conv.created_at}`);
      console.log(`   Completed: ${conv.completed_at || 'N/A'}`);
    });
  }

  // 2. Get all product_interest_data
  console.log('\n\n🎯 PRODUCT INTEREST DATA:');
  const { data: productInterests, error: productError } = await supabase
    .from('product_interest_data')
    .select('id, conversation_id, objective_name, primary_interest, pain_points, received_at')
    .order('received_at', { ascending: false })
    .limit(10);

  if (productError) {
    console.error('❌ Error fetching product interest data:', productError);
  } else if (!productInterests || productInterests.length === 0) {
    console.log('⚠️  No product interest data found in product_interest_data table');
  } else {
    console.log(`✅ Found ${productInterests.length} product interest records (showing last 10):`);
    productInterests.forEach((interest, idx) => {
      console.log(`\n${idx + 1}. Record ID: ${interest.id}`);
      console.log(`   Conversation ID: ${interest.conversation_id}`);
      console.log(`   Objective: ${interest.objective_name}`);
      console.log(`   Primary Interest: ${interest.primary_interest || 'N/A'}`);
      console.log(`   Pain Points: ${interest.pain_points ? JSON.stringify(interest.pain_points) : 'N/A'}`);
      console.log(`   Received: ${interest.received_at}`);
    });
  }

  // 3. Get all video_showcase_data
  console.log('\n\n🎬 VIDEO SHOWCASE DATA:');
  const { data: videoShowcases, error: videoError } = await supabase
    .from('video_showcase_data')
    .select('id, conversation_id, objective_name, videos_shown, received_at')
    .order('received_at', { ascending: false })
    .limit(10);

  if (videoError) {
    console.error('❌ Error fetching video showcase data:', videoError);
  } else if (!videoShowcases || videoShowcases.length === 0) {
    console.log('⚠️  No video showcase data found in video_showcase_data table');
  } else {
    console.log(`✅ Found ${videoShowcases.length} video showcase records (showing last 10):`);
    videoShowcases.forEach((showcase, idx) => {
      console.log(`\n${idx + 1}. Record ID: ${showcase.id}`);
      console.log(`   Conversation ID: ${showcase.conversation_id}`);
      console.log(`   Objective: ${showcase.objective_name}`);
      console.log(`   Videos Shown: ${showcase.videos_shown ? JSON.stringify(showcase.videos_shown) : 'N/A'}`);
      console.log(`   Received: ${showcase.received_at}`);
    });
  }

  // 4. Get all qualification_data (contact info)
  console.log('\n\n👤 QUALIFICATION DATA (Contact Info):');
  const { data: qualifications, error: qualError } = await supabase
    .from('qualification_data')
    .select('id, conversation_id, first_name, last_name, email, position, received_at')
    .order('received_at', { ascending: false })
    .limit(10);

  if (qualError) {
    console.error('❌ Error fetching qualification data:', qualError);
  } else if (!qualifications || qualifications.length === 0) {
    console.log('⚠️  No qualification data found in qualification_data table');
  } else {
    console.log(`✅ Found ${qualifications.length} qualification records (showing last 10):`);
    qualifications.forEach((qual, idx) => {
      console.log(`\n${idx + 1}. Record ID: ${qual.id}`);
      console.log(`   Conversation ID: ${qual.conversation_id}`);
      console.log(`   Name: ${qual.first_name || ''} ${qual.last_name || ''}`);
      console.log(`   Email: ${qual.email || 'N/A'}`);
      console.log(`   Position: ${qual.position || 'N/A'}`);
      console.log(`   Received: ${qual.received_at}`);
    });
  }

  // 5. Cross-reference: Check which conversation IDs exist in conversation_details vs other tables
  console.log('\n\n🔗 CROSS-REFERENCE ANALYSIS:');
  console.log('=' .repeat(80));

  if (conversations && conversations.length > 0) {
    const conversationIds = new Set(conversations.map(c => c.tavus_conversation_id));
    const productConvIds = new Set((productInterests || []).map(p => p.conversation_id));
    const videoConvIds = new Set((videoShowcases || []).map(v => v.conversation_id));
    const qualConvIds = new Set((qualifications || []).map(q => q.conversation_id));

    console.log('\nConversation IDs in conversation_details:', Array.from(conversationIds));
    console.log('Conversation IDs in product_interest_data:', Array.from(productConvIds));
    console.log('Conversation IDs in video_showcase_data:', Array.from(videoConvIds));
    console.log('Conversation IDs in qualification_data:', Array.from(qualConvIds));

    // Find mismatches
    const conversationsWithoutProduct = Array.from(conversationIds).filter(id => !productConvIds.has(id));
    const conversationsWithoutVideo = Array.from(conversationIds).filter(id => !videoConvIds.has(id));
    const conversationsWithoutQual = Array.from(conversationIds).filter(id => !qualConvIds.has(id));

    if (conversationsWithoutProduct.length > 0) {
      console.log('\n⚠️  Conversations WITHOUT product interest data:', conversationsWithoutProduct);
    }
    if (conversationsWithoutVideo.length > 0) {
      console.log('⚠️  Conversations WITHOUT video showcase data:', conversationsWithoutVideo);
    }
    if (conversationsWithoutQual.length > 0) {
      console.log('⚠️  Conversations WITHOUT qualification data:', conversationsWithoutQual);
    }

    // Find orphaned data (data without matching conversation)
    const orphanedProduct = Array.from(productConvIds).filter(id => !conversationIds.has(id));
    const orphanedVideo = Array.from(videoConvIds).filter(id => !conversationIds.has(id));
    const orphanedQual = Array.from(qualConvIds).filter(id => !conversationIds.has(id));

    if (orphanedProduct.length > 0) {
      console.log('\n⚠️  ORPHANED product interest data (no matching conversation):', orphanedProduct);
    }
    if (orphanedVideo.length > 0) {
      console.log('⚠️  ORPHANED video showcase data (no matching conversation):', orphanedVideo);
    }
    if (orphanedQual.length > 0) {
      console.log('⚠️  ORPHANED qualification data (no matching conversation):', orphanedQual);
    }

    if (conversationsWithoutProduct.length === 0 && conversationsWithoutVideo.length === 0 &&
        orphanedProduct.length === 0 && orphanedVideo.length === 0) {
      console.log('\n✅ All conversation IDs match perfectly!');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Debug complete');
}

debugReportingData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
