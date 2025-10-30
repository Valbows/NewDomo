import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    
    let query = supabase
      .from('qualification_data')
      .select('*')
      .order('received_at', { ascending: false });
    
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch qualification data' }, 
      { status: 500 }
    );
  }
}