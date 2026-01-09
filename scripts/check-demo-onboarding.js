const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

// Use service role key (SUPABASE_SECRET_KEY) to bypass RLS
const serviceKey = process.env.SUPABASE_SECRET_KEY;

console.log('Using key type:', serviceKey ? 'SERVICE_ROLE' : 'ANON');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey
);

async function checkDemo() {
  // Find the workday demo
  const { data: demos, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .ilike('name', '%workday%');

  if (demoError) {
    console.log('Error fetching demo:', demoError);
    return;
  }

  if (!demos || demos.length === 0) {
    console.log('No workday demo found');
    return;
  }

  console.log('Found', demos.length, 'workday demos:');
  demos.forEach((d, i) => console.log(`  ${i + 1}. ${d.name} (${d.id})`));
  console.log('');

  // Check all demos
  for (const demo of demos) {
  console.log('=== DEMO INFO ===');
  console.log('ID:', demo.id);
  console.log('Name:', demo.name);
  console.log('');

  console.log('=== STEP 3: AGENT SETTINGS ===');
  console.log('tavus_persona_id:', demo.tavus_persona_id || 'NOT SET');
  console.log('metadata.agentName:', demo.metadata?.agentName || 'NOT SET');
  console.log('metadata.agentPersonality:', demo.metadata?.agentPersonality || 'NOT SET');
  console.log('metadata.agentGreeting:', demo.metadata?.agentGreeting || 'NOT SET');
  console.log('');

  console.log('=== STEP 4: CTA SETTINGS ===');
  console.log('cta_button_url (column):', demo.cta_button_url || 'NOT SET');
  console.log('metadata.ctaTitle:', demo.metadata?.ctaTitle || 'NOT SET');
  console.log('metadata.ctaMessage:', demo.metadata?.ctaMessage || 'NOT SET');
  console.log('metadata.ctaButtonText:', demo.metadata?.ctaButtonText || 'NOT SET');
  console.log('');

  // Check videos
  const { data: videos, error: videoError } = await supabase
    .from('demo_videos')
    .select('id, title, processing_status')
    .eq('demo_id', demo.id);

  console.log('=== STEP 1: VIDEOS ===');
  if (videoError) console.log('Video query error:', videoError.message);
  console.log('Video count:', videos?.length || 0);
  if (videos?.length > 0) {
    videos.forEach(v => console.log('  -', v.title, '(' + v.processing_status + ')'));
  }
  console.log('');

  // Check knowledge chunks
  const { data: chunks, error: chunkError } = await supabase
    .from('knowledge_chunks')
    .select('id, chunk_type, question')
    .eq('demo_id', demo.id);

  console.log('=== STEP 2: KNOWLEDGE BASE ===');
  if (chunkError) console.log('Chunk query error:', chunkError.message);
  console.log('Chunk count:', chunks?.length || 0);
  if (chunks?.length > 0) {
    const types = {};
    chunks.forEach(c => types[c.chunk_type] = (types[c.chunk_type] || 0) + 1);
    console.log('By type:', JSON.stringify(types));
  }
  console.log('');

  // Determine completion status (matching the updated hook logic)
  console.log('=== ONBOARDING STATUS ===');
  const videosComplete = videos && videos.length > 0;
  const knowledgeComplete = chunks && chunks.length > 0;
  // Agent: just needs tavus_persona_id (agent was created)
  const agentComplete = !!demo.tavus_persona_id;
  // CTA: just needs the URL
  const ctaComplete = !!demo.cta_button_url;

  console.log('Step 1 (Videos):', videosComplete ? '✅ COMPLETE' : '❌ INCOMPLETE');
  console.log('Step 2 (Knowledge):', knowledgeComplete ? '✅ COMPLETE' : '❌ INCOMPLETE');
  console.log('Step 3 (Agent):', agentComplete ? '✅ COMPLETE' : '❌ INCOMPLETE', '(has persona_id:', !!demo.tavus_persona_id, ')');
  console.log('Step 4 (CTA):', ctaComplete ? '✅ COMPLETE' : '❌ INCOMPLETE', '(has cta_url:', !!demo.cta_button_url, ')');
  console.log('');
  console.log('All Complete:', videosComplete && knowledgeComplete && agentComplete && ctaComplete ? '✅ YES' : '❌ NO');
  console.log('\n' + '='.repeat(60) + '\n');
  } // end for loop
}

checkDemo();
