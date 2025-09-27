import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to view qualification data
 * GET /api/qualification-data - View all qualification data
 * GET /api/qualification-data?conversation_id=xxx - View specific conversation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('qualification_data')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(limit);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching qualification data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch qualification data', details: error.message },
        { status: 500 }
      );
    }

    // Format the response
    const formattedData = data?.map(item => ({
      id: item.id,
      conversation_id: item.conversation_id,
      contact: {
        name: `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        email: item.email,
        position: item.position
      },
      objective_name: item.objective_name,
      event_type: item.event_type,
      received_at: item.received_at,
      created_at: item.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
      query: {
        conversation_id: conversationId,
        limit
      }
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}