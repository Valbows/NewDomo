const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixes() {
  console.log('🧪 Testing Domo Score fixes...\n');

  const conversationId = 'c747544530dac4c9';
  const demoId = '8cc16f2d-b407-4895-9639-643d1a976da4';

  // Test 1: Simulate video tracking with correct conversation ID
  console.log('1️⃣ Testing video tracking fix...');
  try {
    const response = await fetch('http://localhost:3000/api/track-video-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        demo_id: demoId,
        video_title: 'Workforce Planning: Headcount and Cost Planning'
      })
    });

    if (response.ok) {
      console.log('   ✅ Video tracking API call successful');
      
      // Check if data was inserted
      const { data: videoData } = await supabase
        .from('video_showcase_data')
        .select('*')
        .eq('conversation_id', conversationId);
      
      console.log(`   📊 Video showcase records: ${videoData?.length || 0}`);
      if (videoData && videoData.length > 0) {
        console.log(`   🎬 Videos shown: ${JSON.stringify(videoData[0].videos_shown)}`);
      }
    } else {
      console.log('   ❌ Video tracking API call failed:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Video tracking test failed:', error.message);
  }

  // Test 2: Simulate CTA tracking with correct conversation ID
  console.log('\n2️⃣ Testing CTA tracking fix...');
  try {
    const response = await fetch('http://localhost:3000/api/track-cta-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        demo_id: demoId,
        cta_url: 'https://forms.workday.com/en-us/sales/adaptive-planning-free-trial/form.html?step=step2_sales_contact'
      })
    });

    if (response.ok) {
      console.log('   ✅ CTA tracking API call successful');
      
      // Check if data was inserted
      const { data: ctaData } = await supabase
        .from('cta_tracking')
        .select('*')
        .eq('conversation_id', conversationId);
      
      console.log(`   📊 CTA tracking records: ${ctaData?.length || 0}`);
      if (ctaData && ctaData.length > 0) {
        console.log(`   🖱️  CTA clicked: ${ctaData[0].cta_clicked_at ? 'Yes' : 'No'}`);
      }
    } else {
      console.log('   ❌ CTA tracking API call failed:', response.status);
    }
  } catch (error) {
    console.log('   ❌ CTA tracking test failed:', error.message);
  }

  // Test 3: Calculate new Domo Score
  console.log('\n3️⃣ Calculating updated Domo Score...');
  
  const { data: qualificationData } = await supabase
    .from('qualification_data')
    .select('*')
    .eq('conversation_id', conversationId);

  const { data: productData } = await supabase
    .from('product_interest_data')
    .select('*')
    .eq('conversation_id', conversationId);

  const { data: videoData } = await supabase
    .from('video_showcase_data')
    .select('*')
    .eq('conversation_id', conversationId);

  const { data: ctaData } = await supabase
    .from('cta_tracking')
    .select('*')
    .eq('conversation_id', conversationId);

  const { data: conversationData } = await supabase
    .from('conversation_details')
    .select('*')
    .eq('tavus_conversation_id', conversationId);

  const scores = {
    contactConfirmation: qualificationData && qualificationData.length > 0,
    reasonForVisit: productData && productData.length > 0,
    platformFeatureInterest: videoData && videoData.length > 0 && videoData[0]?.videos_shown?.length > 0,
    ctaExecution: ctaData && ctaData.length > 0 && ctaData[0]?.cta_clicked_at,
    perceptionAnalysis: conversationData && conversationData.length > 0 && conversationData[0]?.perception_analysis
  };

  const totalScore = Object.values(scores).filter(Boolean).length;
  const maxScore = 5;
  const percentage = (totalScore / maxScore) * 100;

  console.log(`\n🏆 UPDATED DOMO SCORE: ${totalScore}/${maxScore} (${percentage.toFixed(0)}%)`);
  console.log(`   Contact Confirmation: ${scores.contactConfirmation ? '✅' : '❌'}`);
  console.log(`   Reason for Visit: ${scores.reasonForVisit ? '✅' : '❌'}`);
  console.log(`   Platform Feature Interest: ${scores.platformFeatureInterest ? '✅' : '❌'}`);
  console.log(`   CTA Execution: ${scores.ctaExecution ? '✅' : '❌'}`);
  console.log(`   Visual Analysis: ${scores.perceptionAnalysis ? '✅' : '❌'}`);

  const improvement = totalScore - 2; // Original score was 2/5
  if (improvement > 0) {
    console.log(`\n🎉 IMPROVEMENT: +${improvement} points! (from 2/5 to ${totalScore}/5)`);
  }
}

testFixes().catch(console.error);