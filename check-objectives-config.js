const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xddjudwawavxwirpkksz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc1ODE4MywiZXhwIjoyMDcyMzM0MTgzfQ.JPQfWlMcq5qaY_4RRweti6TMenXBoSdSklWLaJWZK0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkObjectivesConfig() {
  console.log('🔍 Checking objectives configuration for WorkDay Platform Demo...\n');

  // Get demo data
  const { data: demoData } = await supabase
    .from('demos')
    .select('*')
    .eq('name', 'WorkDay Platform Demo')
    .limit(1);

  if (demoData && demoData.length > 0) {
    const demo = demoData[0];
    console.log('📋 Demo Configuration:');
    console.log(`   Demo ID: ${demo.id}`);
    console.log(`   Tavus Persona ID: ${demo.tavus_persona_id}`);
    console.log(`   Objectives ID: ${demo.objectives_id || 'Not set'}`);
    console.log(`   Agent Name: ${demo.agent_name}`);
    console.log(`   Status: ${demo.status}`);
    
    // Check if there are objectives in metadata
    const metadata = demo.metadata || {};
    console.log(`\n📊 Metadata Objectives: ${JSON.stringify(metadata.objectives || [], null, 2)}`);
    
    // Check if there's a persona configured
    if (demo.tavus_persona_id) {
      console.log(`\n🎭 Persona Configuration:`);
      console.log(`   Persona ID: ${demo.tavus_persona_id}`);
      console.log(`   Note: Objectives are configured at the Tavus persona level`);
      console.log(`   The persona was created with specific objectives baked in`);
    } else {
      console.log(`\n❌ No Tavus persona configured for this demo`);
    }
    
    // Check objectives table if objectives_id is set
    if (demo.objectives_id) {
      const { data: objectivesData } = await supabase
        .from('objectives')
        .select('*')
        .eq('id', demo.objectives_id);
      
      if (objectivesData && objectivesData.length > 0) {
        console.log(`\n🎯 Objectives Configuration:`);
        console.log(JSON.stringify(objectivesData[0], null, 2));
      }
    }
    
    console.log(`\n💡 Analysis:`);
    console.log(`   1. Demo has Tavus persona: ${!!demo.tavus_persona_id ? '✅' : '❌'}`);
    console.log(`   2. Demo has objectives_id: ${!!demo.objectives_id ? '✅' : '❌'}`);
    console.log(`   3. Metadata has objectives: ${metadata.objectives?.length > 0 ? '✅' : '❌'}`);
    
    if (demo.tavus_persona_id && !demo.objectives_id && (!metadata.objectives || metadata.objectives.length === 0)) {
      console.log(`\n🔍 ISSUE IDENTIFIED:`);
      console.log(`   The demo has a Tavus persona but no custom objectives configured.`);
      console.log(`   This means it's using Tavus default objectives, which may not include`);
      console.log(`   the 'product_interest_discovery' objective needed for Domo Score.`);
      console.log(`\n🔧 SOLUTION:`);
      console.log(`   Configure custom objectives that include:`);
      console.log(`   - greeting_and_qualification (✅ working)`);
      console.log(`   - product_interest_discovery (❌ missing)`);
      console.log(`   - video_showcase (handled by tool calls)`);
    }
  }
}

checkObjectivesConfig().catch(console.error);