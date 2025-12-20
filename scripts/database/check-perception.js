const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

async function check() {
  const tavusApiKey = process.env.TAVUS_API_KEY;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  // Get a conversation WITHOUT perception data (recent one)
  const convId = 'ca1aaf8fe5fea4f7';

  console.log('Checking conversation:', convId);
  console.log('Fetching from Tavus API with verbose=true...');

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

  if (!response.ok) {
    console.log('API Error:', response.status);
    return;
  }

  const data = await response.json();

  console.log('\nResponse keys:', Object.keys(data));
  console.log('Has perception_analysis?', !!data.perception_analysis);
  console.log('Has transcript?', !!data.transcript);

  // Check events
  const events = data.events || [];
  console.log('\nEvents count:', events.length);
  const eventTypes = events.map(e => e.event_type).filter((v, i, a) => a.indexOf(v) === i);
  console.log('Event types:', eventTypes.join(', '));

  // Look for perception event
  const perceptionEvent = events.find(e =>
    e.event_type?.includes('perception') ||
    e.properties?.analysis ||
    e.data?.analysis
  );

  if (perceptionEvent) {
    console.log('\nFound perception event:', perceptionEvent.event_type);
    console.log('Perception event keys:', Object.keys(perceptionEvent));
    console.log('Full perception event:', JSON.stringify(perceptionEvent, null, 2).slice(0, 2000));
  } else {
    console.log('\nNo perception event found in events');
  }

  // Also check transcription event
  const transcriptEvent = events.find(e => e.event_type?.includes('transcription'));
  if (transcriptEvent) {
    console.log('\nFound transcript event:', transcriptEvent.event_type);
    console.log('Transcript event keys:', Object.keys(transcriptEvent));
  }

  // Check if perception_analysis is directly on the response
  if (data.perception_analysis) {
    console.log('\nPerception analysis found at top level!');
    console.log('Type:', typeof data.perception_analysis);
    if (typeof data.perception_analysis === 'object') {
      console.log('Keys:', Object.keys(data.perception_analysis).slice(0, 10));
    }
  }
}

check();
