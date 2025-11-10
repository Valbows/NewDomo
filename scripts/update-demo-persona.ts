#!/usr/bin/env npx tsx
/**
 * Update demo records to use the new complete persona
 */

import { createClient } from '@supabase/supabase-js';

const NEW_PERSONA_ID = 'p1a1ed6bd5bf';

async function updateDemoPersonas() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  console.log("🔧 Updating demo records to use new persona...\n");
  console.log(`🎭 New Persona ID: ${NEW_PERSONA_ID}`);
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, let's see what demos exist
    console.log("📋 Checking existing demos...");
    const { data: demos, error: fetchError } = await supabase
      .from('demos')
      .select('id, name, tavus_persona_id, user_id, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch demos: ${fetchError.message}`);
    }

    if (!demos || demos.length === 0) {
      console.log("ℹ️ No demos found in database");
      return;
    }

    console.log(`📊 Found ${demos.length} demos:\n`);
    
    demos.forEach((demo, index) => {
      console.log(`${index + 1}. Demo ID: ${demo.id}`);
      console.log(`   Name: ${demo.name || 'Unnamed'}`);
      console.log(`   Current Persona: ${demo.tavus_persona_id || 'None'}`);
      console.log(`   User ID: ${demo.user_id}`);
      console.log(`   Created: ${demo.created_at}`);
      console.log("");
    });

    // Update each demo to use the new persona
    console.log(`🔄 Updating all demos to use persona: ${NEW_PERSONA_ID}`);
    
    const updatedDemos = [];
    
    for (const demo of demos) {
      console.log(`   Updating demo: ${demo.name || 'Unnamed'} (${demo.id})`);
      
      const { data: updated, error: updateError } = await supabase
        .from('demos')
        .update({ 
          tavus_persona_id: NEW_PERSONA_ID,
          // Clear old conversation data since we're changing personas
          tavus_conversation_id: null,
          metadata: {}
        })
        .eq('id', demo.id)
        .select('id, name, tavus_persona_id')
        .single();

      if (updateError) {
        console.log(`   ❌ Failed to update ${demo.id}: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated ${demo.id}`);
        updatedDemos.push(updated);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedDemos.length} demos`);
    
    if (updatedDemos && updatedDemos.length > 0) {
      console.log("\n📊 Updated demos:");
      updatedDemos.forEach((demo, index) => {
        console.log(`${index + 1}. ${demo.name || 'Unnamed'} (${demo.id})`);
        console.log(`   ✅ Persona: ${demo.tavus_persona_id}`);
      });
    }

    console.log(`\n🎉 All demos now use the complete persona!`);
    console.log(`🎭 Persona ID: ${NEW_PERSONA_ID}`);
    console.log(`📊 Components: System Prompt + Guardrails + Objectives`);
    console.log(`\n💡 You can now test conversations in your app!`);

    return updatedDemos;

  } catch (error) {
    console.error("❌ Failed to update demos:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Demo Persona Updater\n");
  
  try {
    await updateDemoPersonas();
    
  } catch (error) {
    console.error("\n❌ Update failed. Make sure you have:");
    console.log("1. NEXT_PUBLIC_SUPABASE_URL environment variable set");
    console.log("2. SUPABASE_SECRET_KEY environment variable set");
    console.log("3. Valid Supabase access");
  }
}

// Run the script
main();