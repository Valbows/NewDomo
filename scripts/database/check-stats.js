const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://xddjudwawavxwirpkksz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check status distribution
  const { data: statusData } = await supabase
    .from("conversation_details")
    .select("status");

  const statusCounts = {};
  statusData?.forEach(c => {
    const s = c.status || "null";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  console.log("Status distribution:", statusCounts);

  // Check duration data
  const { data: durationData } = await supabase
    .from("conversation_details")
    .select("duration_seconds")
    .not("duration_seconds", "is", null)
    .limit(10);

  console.log("Conversations with duration_seconds:", durationData?.length || 0);
  if (durationData && durationData.length > 0) {
    console.log("Sample durations:", durationData.map(d => d.duration_seconds));
  }

  // Check all durations
  const { data: allDurations } = await supabase
    .from("conversation_details")
    .select("duration_seconds");

  let withDuration = 0;
  let withoutDuration = 0;
  if (allDurations) {
    allDurations.forEach(d => {
      if (d.duration_seconds != null) withDuration++;
      else withoutDuration++;
    });
  }
  console.log("With duration:", withDuration);
  console.log("Without duration:", withoutDuration);
}
check();
