require('dotenv').config({ path: '.env.development' });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xddjudwawavxwirpkksz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillDuration() {
  const apiKey = process.env.TAVUS_API_KEY;

  // Get all conversations without duration
  const { data: conversations, error } = await supabase
    .from("conversation_details")
    .select("id, tavus_conversation_id, duration_seconds")
    .is("duration_seconds", null);

  if (error) {
    console.error("Error fetching conversations:", error.message);
    return;
  }

  console.log(`Found ${conversations.length} conversations without duration\n`);

  let updated = 0;
  let failed = 0;

  for (const conv of conversations) {
    try {
      // Fetch from Tavus API
      const resp = await fetch(`https://tavusapi.com/v2/conversations/${conv.tavus_conversation_id}`, {
        headers: { "x-api-key": apiKey }
      });

      if (!resp.ok) {
        console.log(`  ❌ ${conv.tavus_conversation_id} - Tavus API error: ${resp.status}`);
        failed++;
        continue;
      }

      const data = await resp.json();

      // Calculate duration from timestamps
      if (data.created_at && data.updated_at) {
        const start = new Date(data.created_at).getTime();
        const end = new Date(data.updated_at).getTime();
        const durationSec = Math.round((end - start) / 1000);

        if (durationSec > 0) {
          // Update database
          const { error: updateError } = await supabase
            .from("conversation_details")
            .update({
              duration_seconds: durationSec,
              completed_at: data.updated_at
            })
            .eq("id", conv.id);

          if (updateError) {
            console.log(`  ❌ ${conv.tavus_conversation_id} - DB update error: ${updateError.message}`);
            failed++;
          } else {
            const min = Math.floor(durationSec / 60);
            const sec = durationSec % 60;
            console.log(`  ✅ ${conv.tavus_conversation_id} - ${min}:${String(sec).padStart(2, "0")}`);
            updated++;
          }
        }
      }
    } catch (e) {
      console.log(`  ❌ ${conv.tavus_conversation_id} - Error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
}

backfillDuration();
