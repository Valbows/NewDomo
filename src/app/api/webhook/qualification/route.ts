import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook endpoint to receive qualification data from Tavus objectives
 * Triggered when "greeting_and_qualification" objective completes
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    
    // Log request headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    
    // Parse the webhook payload
    const payload = await request.json();
    
    // Log specific fields we're looking for
    
    if (payload.properties) {
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

    
    if (outputVars) {
    }

    // Verify this is the right objective
    if (objective_name !== 'greeting_and_qualification') {
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

    // Store in Supabase
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
    endpoint: '/api/webhook/qualification',
    method: 'POST',
    purpose: 'Receives qualification data from Tavus objectives'
  });
}