import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get('demo_id');

    if (!demoId) {
      return NextResponse.json({ error: 'demo_id parameter required' }, { status: 400 });
    }

    // Get conversations with transcript data
    const { data: conversations, error } = await supabase
      .from('conversation_details')
      .select('id, tavus_conversation_id, transcript, conversation_name')
      .eq('demo_id', demoId)
      .limit(5);

    if (error) throw error;

    const diagnostics = conversations?.map(conv => {
      const transcript = conv.transcript;
      const stringified = String(transcript);
      
      return {
        conversation_id: conv.tavus_conversation_id,
        conversation_name: conv.conversation_name,
        transcript_analysis: {
          type: typeof transcript,
          is_null: transcript === null,
          is_undefined: transcript === undefined,
          is_array: Array.isArray(transcript),
          array_length: Array.isArray(transcript) ? transcript.length : null,
          stringified_preview: stringified.substring(0, 100),
          has_object_issue: stringified === '[object Object]',
          object_keys: (typeof transcript === 'object' && transcript !== null) ? Object.keys(transcript) : null,
          sample_entry: Array.isArray(transcript) && transcript.length > 0 ? transcript[0] : null
        }
      };
    }) || [];

    return NextResponse.json({
      demo_id: demoId,
      conversations_analyzed: conversations?.length || 0,
      diagnostics,
      summary: {
        total_conversations: conversations?.length || 0,
        has_transcript: diagnostics.filter(d => d.transcript_analysis.type !== 'undefined' && !d.transcript_analysis.is_null).length,
        object_issues: diagnostics.filter(d => d.transcript_analysis.has_object_issue).length,
        array_format: diagnostics.filter(d => d.transcript_analysis.is_array).length,
        string_format: diagnostics.filter(d => d.transcript_analysis.type === 'string').length
      }
    });

  } catch (error) {
    console.error('Transcript diagnostic error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transcripts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}