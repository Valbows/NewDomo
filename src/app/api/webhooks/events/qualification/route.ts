import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook endpoint to receive qualification data from Tavus objectives
 * Triggered when "greeting_and_qualification" objective completes
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 QUALIFICATION WEBHOOK RECEIVED - ${timestamp}`);
    console.log('='.repeat(60));
    
    // Log request headers for debugging
    console.log('📡 Request Headers:');
    const headers = Object.fromEntries(request.headers.entries());
    console.log(JSON.stringify(headers, null, 2));
    
    // Parse the webhook payload
    const payload = await request.json();
    console.log('\n📋 FULL WEBHOOK PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Log specific fields we're looking for
    console.log('\n🔍 EXTRACTED FIELDS:');
    console.log(`   conversation_id: ${payload.conversation_id || 'MISSING'}`);
    console.log(`   event_type: ${payload.event_type || 'MISSING'}`);
    console.log(`   objective_name: ${payload.objective_name || 'MISSING'}`);
    console.log(`   properties: ${payload.properties ? 'PRESENT' : 'MISSING'}`);
    
    if (payload.properties) {
      console.log('   📊 Properties breakdown:');
      console.log(`      first_name: ${payload.properties.first_name || 'MISSING'}`);
      console.log(`      last_name: ${payload.properties.last_name || 'MISSING'}`);
      console.log(`      email: ${payload.properties.email || 'MISSING'}`);
      console.log(`      position: ${payload.properties.position || 'MISSING'}`);
    }

    // Extract the qualification data - handle both old and new Tavus format
    const {
      properties,
      conversation_id,
      event_type,
      objective_name: directObjectiveName,
      timestamp: payloadTimestamp
    } = payload;

    // Handle nested objective name (new Tavus format)
    const objective_name = directObjectiveName || properties?.objective_name;
    
    // Handle nested output variables (new Tavus format)
    const outputVars = properties?.output_variables || properties || {};

    console.log('\n🔍 EXTRACTED FIELDS (Updated Logic):');
    console.log(`   conversation_id: ${conversation_id || 'MISSING'}`);
    console.log(`   event_type: ${event_type || 'MISSING'}`);
    console.log(`   objective_name: ${objective_name || 'MISSING'}`);
    console.log(`   output_variables source: ${properties?.output_variables ? 'NESTED' : 'DIRECT'}`);
    
    if (outputVars) {
      console.log('   📊 Output Variables:');
      console.log(`      first_name: ${outputVars.first_name || 'MISSING'}`);
      console.log(`      last_name: ${outputVars.last_name || 'MISSING'}`);
      console.log(`      email: ${outputVars.email || 'MISSING'}`);
      console.log(`      position: ${outputVars.position || 'MISSING'}`);
    }

    // Verify this is the right objective
    if (objective_name !== 'greeting_and_qualification') {
      console.log(`⚠️  Ignoring webhook for objective: ${objective_name}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Objective not handled by this webhook' 
      });
    }

    // Verify we have the expected data
    if (!outputVars || !conversation_id) {
      console.error('❌ Missing required data in webhook payload');
      console.error(`   outputVars: ${!!outputVars}`);
      console.error(`   conversation_id: ${!!conversation_id}`);
      return NextResponse.json(
        { error: 'Missing output variables or conversation_id' },
        { status: 400 }
      );
    }

    // Extract qualification fields from the correct location
    const qualificationData = {
      conversation_id,
      first_name: outputVars.first_name || null,
      last_name: outputVars.last_name || null,
      email: outputVars.email || null,
      position: outputVars.position || null,
      objective_name,
      event_type,
      received_at: timestamp,
      raw_payload: payload
    };

    console.log('\n💾 STORING QUALIFICATION DATA:');
    console.log(JSON.stringify(qualificationData, null, 2));

    // Store in Supabase
    console.log('\n📤 Inserting into Supabase...');
    const { data, error } = await supabase
      .from('qualification_data')
      .insert(qualificationData)
      .select()
      .single();

    if (error) {
      console.error('\n❌ SUPABASE ERROR:');
      console.error(JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to store qualification data', details: error.message },
        { status: 500 }
      );
    }

    console.log('\n✅ QUALIFICATION DATA STORED SUCCESSFULLY:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n🎉 DATABASE RECORD CREATED:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Conversation: ${data.conversation_id}`);
    console.log(`   Contact: ${data.first_name} ${data.last_name} (${data.email})`);
    console.log(`   Position: ${data.position}`);
    console.log(`   Received: ${data.received_at}`);
    console.log('='.repeat(60) + '\n');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Qualification data stored successfully',
      data: {
        id: data.id,
        conversation_id: data.conversation_id,
        contact: {
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email,
          position: data.position
        }
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
    message: 'Qualification webhook endpoint is active',
    endpoint: '/api/webhooks/events/qualification',
    method: 'POST',
    purpose: 'Receives qualification data from Tavus objectives'
  });
}