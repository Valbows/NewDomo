/**
 * CTA (Call-to-Action) Test Suite
 * This test verifies that CTA data flows correctly from the dashboard configuration
 * to the experience page's "Start Free Trial" button.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEMO_ID = 'd1f91061-cd63-4ec7-bfff-a37016804e1c';

export async function testCTADataFlow() {
  console.log('🧪 Starting CTA Data Flow Test\n');
  
  try {
    // Step 1: Fetch demo data from Supabase
    console.log('📥 Step 1: Fetching demo data from Supabase...');
    const { data: demo, error } = await supabase
      .from('demos')
      .select('*')
      .eq('id', DEMO_ID)
      .single();
    
    if (error) {
      console.error('❌ Error fetching demo:', error);
      return false;
    }
    
    console.log('✅ Demo fetched successfully');
    console.log('📊 Full demo data:', JSON.stringify(demo, null, 2));
    
    // Step 2: Check metadata structure
    console.log('\n📦 Step 2: Checking metadata structure...');
    console.log('Metadata type:', typeof demo.metadata);
    console.log('Raw metadata:', demo.metadata);
    
    // Step 3: Parse metadata if it's a string
    let metadata = demo.metadata;
    if (typeof metadata === 'string') {
      console.log('⚠️  Metadata is a string, attempting to parse...');
      try {
        metadata = JSON.parse(metadata);
        console.log('✅ Metadata parsed successfully');
      } catch (e) {
        console.error('❌ Failed to parse metadata:', e);
        return false;
      }
    }
    
    // Step 4: Check CTA fields
    console.log('\n🎯 Step 3: Checking CTA fields...');
    const ctaFields = {
      ctaTitle: metadata?.ctaTitle,
      ctaMessage: metadata?.ctaMessage,
      ctaButtonText: metadata?.ctaButtonText,
      ctaButtonUrl: metadata?.ctaButtonUrl
    };
    
    console.log('CTA Data:', ctaFields);
    
    // Step 5: Validate CTA URL
    console.log('\n🔗 Step 4: Validating CTA URL...');
    if (!ctaFields.ctaButtonUrl) {
      console.error('❌ CTA URL is missing or undefined!');
      console.log('💡 Please configure the CTA URL in the dashboard at:');
      console.log(`   http://localhost:3001/demos/${DEMO_ID}/configure`);
      console.log('   Navigate to the "Call-to-Action" tab and enter a URL');
      return false;
    }
    
    console.log(`✅ CTA URL found: ${ctaFields.ctaButtonUrl}`);
    
    // Step 6: Test URL validity
    try {
      new URL(ctaFields.ctaButtonUrl);
      console.log('✅ CTA URL is valid');
    } catch (e) {
      console.error('❌ CTA URL is not a valid URL:', ctaFields.ctaButtonUrl);
      return false;
    }
    
    console.log('\n✅ All CTA tests passed!');
    console.log('📋 Summary:');
    console.log(`   Title: ${ctaFields.ctaTitle || '(using default)'}`);
    console.log(`   Message: ${ctaFields.ctaMessage || '(using default)'}`);
    console.log(`   Button Text: ${ctaFields.ctaButtonText || '(using default)'}`);
    console.log(`   Button URL: ${ctaFields.ctaButtonUrl}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCTADataFlow().then(success => {
    process.exit(success ? 0 : 1);
  });
}