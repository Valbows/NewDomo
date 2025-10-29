#!/usr/bin/env tsx

/**
 * Script to ensure all personas in the system have raven-0 perception analysis enabled
 * Run this after updating your persona creation code to fix existing personas
 */

import { createClient } from '@/utils/supabase';
import { ensureAllPersonasHaveRaven, summarizePerceptionStatus } from '@/lib/tavus';

async function ensureAllRaven() {
  console.log('🔍 Ensuring all personas have raven-0 perception analysis enabled...\n');

  const supabase = createClient();

  try {
    // Get all demos with persona IDs from the database
    const { data: demos, error } = await supabase
      .from('demos')
      .select('id, name, user_id, tavus_persona_id')
      .not('tavus_persona_id', 'is', null);

    if (error) {
      throw error;
    }

    if (!demos || demos.length === 0) {
      console.log('ℹ️  No demos with personas found in the database');
      return;
    }

    // Get unique persona IDs
    const personaIds = [...new Set(demos.map(d => d.tavus_persona_id).filter(Boolean))];
    
    console.log(`📊 Found ${personaIds.length} unique personas across ${demos.length} demos`);
    console.log(`🎭 Persona IDs: ${personaIds.join(', ')}\n`);

    // Group demos by persona for reporting
    const personaToDemo = new Map();
    demos.forEach(demo => {
      if (demo.tavus_persona_id) {
        if (!personaToDemo.has(demo.tavus_persona_id)) {
          personaToDemo.set(demo.tavus_persona_id, []);
        }
        personaToDemo.get(demo.tavus_persona_id).push(demo);
      }
    });

    // Update all personas to use raven-0
    console.log('🔄 Updating personas to use raven-0 perception model...\n');
    
    const results = await ensureAllPersonasHaveRaven(personaIds);
    const summary = summarizePerceptionStatus(results);

    // Detailed reporting
    console.log('📋 Detailed Results:');
    console.log('==================');
    
    results.forEach(result => {
      const associatedDemos = personaToDemo.get(result.persona_id) || [];
      const demoNames = associatedDemos.map((d: any) => d.name).join(', ');
      
      console.log(`\n🎭 Persona: ${result.persona_id}`);
      console.log(`   Name: ${result.persona_name || 'Unknown'}`);
      console.log(`   Associated demos: ${demoNames}`);
      console.log(`   Previous model: ${result.current_perception_model || 'not set'}`);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else if (result.updated) {
        console.log(`   ✅ Updated to raven-0`);
      } else if (!result.needs_update) {
        console.log(`   ✅ Already using raven-0`);
      }
    });

    // Summary
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Total personas: ${summary.total}`);
    console.log(`Already enabled: ${summary.already_enabled}`);
    console.log(`Successfully updated: ${summary.successfully_updated}`);
    console.log(`Failed: ${summary.failed}`);

    if (summary.errors.length > 0) {
      console.log('\n❌ Errors:');
      summary.errors.forEach(error => {
        console.log(`   - ${error.persona_id}: ${error.error}`);
      });
    }

    const totalEnabled = summary.already_enabled + summary.successfully_updated;
    console.log(`\n🎉 Result: ${totalEnabled}/${summary.total} personas now have raven-0 enabled!`);

    if (summary.failed > 0) {
      console.log(`\n⚠️  ${summary.failed} persona(s) failed to update. Check the errors above.`);
      process.exit(1);
    } else {
      console.log('\n✅ All personas successfully configured for perception analysis!');
    }

  } catch (error) {
    console.error('💥 Error during raven-0 setup:', error);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  ensureAllRaven().catch(console.error);
}

export { ensureAllRaven };