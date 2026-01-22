/**
 * Script to check all personas for raven-0 perception model
 * Run with: npx tsx scripts/check-raven-perception.ts
 */

import { config } from 'dotenv';
config({ path: '.env.development' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
console.log('Tavus API Key:', process.env.TAVUS_API_KEY ? 'Found' : 'Missing');

function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function checkPersonas() {
  const supabase = createServiceClient();
  const apiKey = process.env.TAVUS_API_KEY;

  if (!apiKey) {
    console.log('ERROR: TAVUS_API_KEY not set');
    process.exit(1);
  }

  // Get all demos with personas
  const { data: demos, error } = await supabase
    .from('demos')
    .select('id, name, tavus_persona_id')
    .not('tavus_persona_id', 'is', null);

  if (error) {
    console.log('Error fetching demos:', error);
    process.exit(1);
  }

  const demoList = demos || [];
  console.log(`\nFound ${demoList.length} demos with personas:\n`);

  let okCount = 0;
  let missingCount = 0;

  for (const demo of demoList) {
    try {
      const response = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
        headers: { 'x-api-key': apiKey }
      });

      if (response.ok) {
        const persona = await response.json();
        const hasRaven = persona.perception_model === 'raven-0';

        if (hasRaven) {
          console.log(`✓ ${demo.name}`);
          console.log(`  Perception: raven-0`);
          okCount++;
        } else {
          console.log(`✗ ${demo.name}`);
          console.log(`  Perception: ${persona.perception_model || 'NOT SET'}`);
          console.log(`  Persona ID: ${demo.tavus_persona_id}`);
          missingCount++;
        }
        console.log('');
      } else {
        console.log(`? ${demo.name} - Failed to fetch (${response.status})`);
        console.log('');
      }
    } catch (e) {
      console.log(`? ${demo.name} - Error`);
      console.log('');
    }
  }

  console.log('-------------------');
  console.log(`Total: ${demoList.length}`);
  console.log(`With raven-0: ${okCount}`);
  console.log(`Missing raven-0: ${missingCount}`);
}

checkPersonas();
