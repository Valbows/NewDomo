import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook endpoint to receive product interest data from Tavus objectives
 * Triggered when "product_interest_discovery" objective completes
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 PRODUCT INTEREST WEBHOOK RECEIVED - ${timestamp}`);
    console.log('='.repeat(60));
    
    // Log request headers for debugging
    console.log('📡 Request Headers:');
    const headers = Object.fromEntries(request.headers.entries());
    console.log(JSON.stringify(headers, null, 2));
    
    // Parse the webhook payload
    const payload = await request.json();
    console.log('\n📋 FULL WEBHOOK PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Extract the product interest data - handle both old and new Tavus format
    const {
      properties,
      conversation_id,
      event_type,
      objective_name: directObjectiveName,
    } = payload;

    // Handle nested objective name (new Tavus format)
    const objective_name = directObjectiveName || properties?.objective_name;
    
    // Handle nested output variables (new Tavus format)
    const outputVars = properties?.output_variables || properties || {};

    console.log('\n🔍 EXTRACTED FIELDS:');
    console.log(`   conversation_id: ${conversation_id || 'MISSING'}`);
    console.log(`   event_type: ${event_type || 'MISSING'}`);
    console.log(`   objective_name: ${objective_name || 'MISSING'}`);
    
    if (outputVars) {
      console.log('   📊 Output Variables:');
      console.log(`      primary_interest: ${outputVars.primary_interest || 'MISSING'}`);
      console.log(`      pain_points: ${outputVars.pain_points || 'MISSING'}`);
    }

    // Verify this is the right objective
    if (objective_name !== 'product_interest_discovery') {
      console.log(`⚠️  Ignoring webhook for objective: ${objective_name}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Objective not handled by this webhook' 
      });
    }

    // Verify we have the expected data
    if (!outputVars || !conversation_id) {
      console.error('❌ Missing required data in webhook payload');
      return NextResponse.json(
        { error: 'Missing output variables or conversation_id' },
        { status: 400 }
      );
    }

    // Extract product interest fields
    const productInterestData = {
      conversation_id,
      objective_name,
      primary_interest: outputVars.primary_interest || null,
      pain_points: outputVars.pain_points ? 
        (Array.isArray(outputVars.pain_points) ? outputVars.pain_points : [outputVars.pain_points]) : 
        null,
      event_type,
      received_at: timestamp,
      raw_payload: payload
    };

    console.log('\n💾 STORING PRODUCT INTEREST DATA:');
    console.log(JSON.stringify(productInterestData, null, 2));

    // Store in Supabase
    console.log('\n📤 Inserting into Supabase...');
    const { data, error } = await supabase
      .from('product_interest_data')
      .insert(productInterestData)
      .select()
      .single();

    if (error) {
      console.error('\n❌ SUPABASE ERROR:');
      console.error(JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to store product interest data', details: error.message },
        { status: 500 }
      );
    }

    console.log('\n✅ PRODUCT INTEREST DATA STORED SUCCESSFULLY:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🎉 DATABASE RECORD CREATED:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Conversation: ${data.conversation_id}`);
    console.log(`   Primary Interest: ${data.primary_interest}`);
    console.log(`   Pain Points: ${data.pain_points?.join(', ') || 'None'}`);
    console.log(`   Received: ${data.received_at}`);
    console.log('='.repeat(60) + '\n');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Product interest data stored successfully',
      data: {
        id: data.id,
        conversation_id: data.conversation_id,
        primary_interest: data.primary_interest,
        pain_points: data.pain_points
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Product interest webhook endpoint is active',
    endpoint: '/api/webhook/product-interest',
    method: 'POST',
    purpose: 'Receives product interest data from Tavus objectives'
  });
}