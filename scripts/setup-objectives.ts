#!/usr/bin/env npx tsx
/**
 * Setup Tavus Objectives for Domo A.I.
 * Creates all objective templates in Tavus and displays their IDs
 */

import { createObjectivesManager } from '../src/lib/tavus/objectives-manager';
import { OBJECTIVES_TEMPLATES } from '../src/lib/tavus/objectives-templates';

async function setupObjectives() {
  console.log('🎯 Setting up Tavus Objectives for Domo A.I.\n');

  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY environment variable is required');
    console.log('Set it with: export TAVUS_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    const manager = createObjectivesManager();

    // Create all objective templates
    const results = [];

    console.log('📋 Creating Product Demo Objectives...');
    const demoObjectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.PRODUCT_DEMO);
    results.push({
      name: 'Product Demo Flow',
      id: demoObjectives.uuid,
      envVar: 'DOMO_AI_DEMO_OBJECTIVES_ID'
    });

    console.log('📋 Creating Lead Qualification Objectives...');
    const qualificationObjectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.LEAD_QUALIFICATION);
    results.push({
      name: 'Lead Qualification Flow',
      id: qualificationObjectives.uuid,
      envVar: 'DOMO_AI_QUALIFICATION_OBJECTIVES_ID'
    });

    console.log('📋 Creating Customer Support Objectives...');
    const supportObjectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.CUSTOMER_SUPPORT);
    results.push({
      name: 'Customer Support & Training',
      id: supportObjectives.uuid,
      envVar: 'DOMO_AI_SUPPORT_OBJECTIVES_ID'
    });

    console.log('\n🎉 All objectives created successfully!\n');

    // Display results
    console.log('📝 Objectives Summary:');
    console.log('=' .repeat(60));
    results.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`  ID: ${result.id}`);
      console.log(`  Env Variable: ${result.envVar}`);
      console.log('');
    });

    // Display environment variables to set
    console.log('🔧 Environment Variables to Set:');
    console.log('=' .repeat(60));
    console.log('Add these to your .env.local file:\n');
    results.forEach(result => {
      console.log(`${result.envVar}=${result.id}`);
    });

    console.log('\n💡 Usage Examples:');
    console.log('=' .repeat(60));
    console.log('# Create persona with demo objectives');
    console.log('const persona = await createDomoAIPersona({');
    console.log(`  objectives_id: "${results[0].id}"`);
    console.log('});');
    console.log('');
    console.log('# Or use environment variable');
    console.log('const objectivesId = getObjectivesIdFromEnv("demo");');
    console.log('const persona = await createDomoAIPersona({ objectives_id: objectivesId });');

    console.log('\n✅ Setup complete! Your Tavus personas can now use structured objectives.');

  } catch (error) {
    console.error('❌ Failed to setup objectives:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('\n🔑 Authentication Error:');
        console.log('- Check that your TAVUS_API_KEY is correct');
        console.log('- Ensure your API key has objectives creation permissions');
      } else if (error.message.includes('400')) {
        console.log('\n📝 Request Error:');
        console.log('- Check the objectives template format');
        console.log('- Ensure all required fields are provided');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('\n🌐 Network Error:');
        console.log('- Check your internet connection');
        console.log('- Verify Tavus API is accessible');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  setupObjectives();
}

export { setupObjectives };