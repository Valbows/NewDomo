const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function syncConversation(convId) {
  const tavusApiKey = process.env.TAVUS_API_KEY;

  console.log('Syncing conversation:', convId);

  const response = await fetch(
    `https://tavusapi.com/v2/conversations/${convId}?verbose=true`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    }
  );

  const data = await response.json();
  const events = data.events || [];

  // Find perception analysis
  const perceptionEvent = events.find(e => e.event_type === 'application.perception_analysis');
  const perceptionAnalysis = perceptionEvent?.properties?.analysis || null;

  // Find transcript
  const transcriptEvent = events.find(e => e.event_type === 'application.transcription_ready');
  const transcript = transcriptEvent?.properties?.transcript || null;

  console.log('Has perception:', perceptionAnalysis ? 'YES' : 'NO');
  console.log('Has transcript:', transcript ? 'YES' : 'NO');

  // Update the database
  const { error } = await supabase
    .from('conversation_details')
    .update({
      perception_analysis: perceptionAnalysis,
      transcript: transcript,
    })
    .eq('tavus_conversation_id', convId);

  if (error) {
    console.log('Update error:', error);
  } else {
    console.log('Updated conversation_details with perception and transcript');
  }
}

// Sync all recent conversations missing perception analysis
async function syncAll() {
  const { data: conversations } = await supabase
    .from('conversation_details')
    .select('tavus_conversation_id')
    .is('perception_analysis', null)
    .eq('demo_id', '8cc16f2d-b407-4895-9639-643d1a976da4')
    .limit(20);

  console.log('Found', conversations?.length || 0, 'conversations without perception analysis\n');

  for (const conv of conversations || []) {
    await syncConversation(conv.tavus_conversation_id);
    console.log('');
  }
}

syncAll();
