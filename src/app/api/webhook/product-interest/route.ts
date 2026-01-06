import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook endpoint to receive product interest data from Tavus objectives
 * Triggered when "product_interest_discovery" objective completes
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    
    // Log request headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    
    // Parse the webhook payload
    const payload = await request.json();
    
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

    
    if (outputVars) {
    }

    // Verify this is the right objective
    if (objective_name !== 'product_interest_discovery') {
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

    // Store in Supabase
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