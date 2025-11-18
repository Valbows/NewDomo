// Store detailed conversation data (transcript, perception) in conversation_details table
export async function storeDetailedConversationData(
  supabase: any,
  conversationId: string,
  event: any
): Promise<void> {
  if (!conversationId) return;

  try {
    // Find the demo associated with this conversation
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id')
      .eq('tavus_conversation_id', conversationId)
      .single();

    if (demoError || !demo) {
      console.warn(`No demo found for conversation ${conversationId}`);
      return;
    }

    // Extract transcript and perception data from the webhook event
    // Handle both direct event data and events array format
    let transcript = event?.data?.transcript ||
                     event?.transcript ||
                     event?.data?.messages ||
                     event?.messages ||
                     null;

    let perceptionAnalysis = event?.data?.perception ||
                            event?.perception ||
                            event?.data?.analysis ||
                            event?.analysis ||
                            event?.data?.analytics ||
                            event?.analytics ||
                            null;

    // Also check if data is in events array format (like API response)
    const events = event?.events || event?.data?.events || [];
    if (events.length > 0) {
      const transcriptEvent = events.find((e: any) =>
        e.event_type === 'application.transcription_ready'
      );
      if (transcriptEvent?.properties?.transcript) {
        transcript = transcriptEvent.properties.transcript;
      }

      const perceptionEvent = events.find((e: any) =>
        e.event_type === 'application.perception_analysis'
      );
      if (perceptionEvent?.properties?.analysis) {
        perceptionAnalysis = perceptionEvent.properties.analysis;
      }
    }

    // Only update if we have transcript or perception data
    if (!transcript && !perceptionAnalysis) {
      console.log('No transcript or perception data in webhook event');
      return;
    }

    console.log(`📊 Storing detailed conversation data for ${conversationId}:`);
    console.log(`- Transcript entries: ${transcript ? (Array.isArray(transcript) ? transcript.length : 'present') : 'none'}`);
    console.log(`- Perception data: ${perceptionAnalysis ? 'present' : 'none'}`);

    // Upsert the conversation details
    const { error: upsertError } = await supabase
      .from('conversation_details')
      .upsert({
        tavus_conversation_id: conversationId,
        demo_id: demo.id,
        transcript: transcript,
        perception_analysis: perceptionAnalysis,
        status: 'completed', // Mark as completed when we receive webhook
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'tavus_conversation_id'
      });

    if (upsertError) {
      console.error('Failed to store detailed conversation data:', upsertError);
    } else {
      console.log('✅ Successfully stored detailed conversation data');
    }

  } catch (error) {
    console.error('Error storing detailed conversation data:', error);
  }
}
