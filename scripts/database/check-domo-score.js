const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDomoScoreData() {
  console.log('🔍 Checking Domo Score data for recent conversations...\n');

  // Get the most recent conversation from the logs
  const conversationId = 'c747544530dac4c9'; // From the console logs

  console.log(`📊 Checking data for conversation: ${conversationId}\n`);

  // Check qualification data (Contact Info)
  const { data: qualificationData, error: qualError } = await supabase
    .from('qualification_data')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('received_at', { ascending: false })
    .limit(1);

  console.log('1️⃣ Contact Confirmation:');
  if (qualError) {
    console.log('   ❌ Error:', qualError.message);
  } else if (qualificationData && qualificationData.length > 0) {
    const contact = qualificationData[0];
    console.log('   ✅ CAPTURED');
    console.log(`   📧 Email: ${contact.email}`);
    console.log(`   👤 Name: ${contact.first_name} ${contact.last_name}`);
    console.log(`   💼 Position: ${contact.position}`);
    console.log(`   ⏰ Received: ${contact.received_at}`);
  } else {
    console.log('   ❌ NOT CAPTURED');
  }

  // Check product interest data
  const { data: productData, error: productError } = await supabase
    .from('product_interest_data')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('received_at', { ascending: false })
    .limit(1);

  console.log('\n2️⃣ Reason Why They Visited Site:');
  if (productError) {
    console.log('   ❌ Error:', productError.message);
  } else if (productData && productData.length > 0) {
    const interest = productData[0];
    console.log('   ✅ CAPTURED');
    console.log(`   🎯 Primary Interest: ${interest.primary_interest}`);
    console.log(`   💡 Pain Points: ${JSON.stringify(interest.pain_points)}`);
    console.log(`   ⏰ Received: ${interest.received_at}`);
  } else {
    console.log('   ❌ NOT CAPTURED');
  }

  // Check video showcase data
  const { data: videoData, error: videoError } = await supabase
    .from('video_showcase_data')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('received_at', { ascending: false })
    .limit(1);

  console.log('\n3️⃣ Platform Feature Most Interested In:');
  if (videoError) {
    console.log('   ❌ Error:', videoError.message);
  } else if (videoData && videoData.length > 0) {
    const video = videoData[0];
    console.log('   ✅ CAPTURED');
    console.log(`   🎬 Videos Shown: ${JSON.stringify(video.videos_shown)}`);
    console.log(`   📝 Objective: ${video.objective_name}`);
    console.log(`   ⏰ Received: ${video.received_at}`);
  } else {
    console.log('   ❌ NOT CAPTURED');
  }

  // Check CTA tracking data
  const { data: ctaData, error: ctaError } = await supabase
    .from('cta_tracking')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('cta_shown_at', { ascending: false })
    .limit(1);

  console.log('\n4️⃣ CTA Execution:');
  if (ctaError) {
    console.log('   ❌ Error:', ctaError.message);
  } else if (ctaData && ctaData.length > 0) {
    const cta = ctaData[0];
    console.log('   ✅ CAPTURED');
    console.log(`   👁️  CTA Shown: ${cta.cta_shown_at ? 'Yes' : 'No'}`);
    console.log(`   🖱️  CTA Clicked: ${cta.cta_clicked_at ? 'Yes' : 'No'}`);
    console.log(`   🔗 CTA URL: ${cta.cta_url}`);
    if (cta.cta_clicked_at) {
      console.log(`   ⏰ Clicked At: ${cta.cta_clicked_at}`);
    }
  } else {
    console.log('   ❌ NOT CAPTURED');
  }

  // Check conversation details for perception analysis
  const { data: conversationData, error: convError } = await supabase
    .from('conversation_details')
    .select('*')
    .eq('tavus_conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('\n5️⃣ Visual Analysis (Perception):');
  if (convError) {
    console.log('   ❌ Error:', convError.message);
  } else if (conversationData && conversationData.length > 0) {
    const conversation = conversationData[0];
    if (conversation.perception_analysis) {
      console.log('   ✅ CAPTURED');
      console.log(`   🧠 Analysis Type: ${typeof conversation.perception_analysis}`);
      if (typeof conversation.perception_analysis === 'string') {
        const preview = conversation.perception_analysis.substring(0, 100);
        console.log(`   📝 Preview: ${preview}...`);
      } else {
        console.log(`   📊 Structured Data: ${JSON.stringify(conversation.perception_analysis, null, 2).substring(0, 200)}...`);
      }
    } else {
      console.log('   ❌ NOT CAPTURED');
    }
  } else {
    console.log('   ❌ NOT CAPTURED');
  }

  // Calculate final Domo Score
  console.log('\n🏆 DOMO SCORE CALCULATION:');
  
  const scores = {
    contactConfirmation: qualificationData && qualificationData.length > 0,
    reasonForVisit: productData && productData.length > 0,
    platformFeatureInterest: videoData && videoData.length > 0 && videoData[0].videos_shown && videoData[0].videos_shown.length > 0,
    ctaExecution: ctaData && ctaData.length > 0 && ctaData[0].cta_clicked_at,
    perceptionAnalysis: conversationData && conversationData.length > 0 && conversationData[0].perception_analysis
  };

  const totalScore = Object.values(scores).filter(Boolean).length;
  const maxScore = 5;
  const percentage = (totalScore / maxScore) * 100;

  console.log(`   📊 Score: ${totalScore}/${maxScore} (${percentage.toFixed(0)}%)`);
  console.log(`   🎯 Breakdown:`);
  console.log(`      Contact Confirmation: ${scores.contactConfirmation ? '✅' : '❌'}`);
  console.log(`      Reason for Visit: ${scores.reasonForVisit ? '✅' : '❌'}`);
  console.log(`      Platform Feature Interest: ${scores.platformFeatureInterest ? '✅' : '❌'}`);
  console.log(`      CTA Execution: ${scores.ctaExecution ? '✅' : '❌'}`);
  console.log(`      Visual Analysis: ${scores.perceptionAnalysis ? '✅' : '❌'}`);

  console.log('\n💡 RECOMMENDATIONS:');
  if (!scores.contactConfirmation) {
    console.log('   • Contact info not captured - check qualification objective');
  }
  if (!scores.reasonForVisit) {
    console.log('   • Product interest not captured - check interest tracking');
  }
  if (!scores.platformFeatureInterest) {
    console.log('   • No videos viewed - check video showcase functionality');
  }
  if (!scores.ctaExecution) {
    console.log('   • CTA not clicked - check CTA presentation and tracking');
  }
  if (!scores.perceptionAnalysis) {
    console.log('   • Visual analysis missing - check Tavus perception settings');
  }
}

checkDomoScoreData().catch(console.error);