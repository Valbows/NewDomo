import { UIState } from '@/lib/tavus/UI_STATES';
import type { Demo } from '../types';

export async function handleConversationEnd(
  demo: Demo | null,
  setUiState: (state: UIState) => void,
  router: any,
  demoId: string
) {
  console.log('Conversation ended');

  // End the Tavus conversation via API if we have a conversation ID
  if (demo?.tavus_conversation_id) {
    try {
      console.log('🔚 Ending Tavus conversation:', {
        conversationId: demo.tavus_conversation_id,
        demoId: demo.id,
        demoData: demo,
      });
      const response = await fetch('/api/end-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: demo.tavus_conversation_id,
          demoId: demo.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tavus conversation ended successfully:', result);

        // Automatically sync conversation data after ending
        try {
          console.log('🔄 Syncing conversation data...');
          const syncResponse = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
            method: 'GET',
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('✅ Conversation data synced successfully:', syncResult);
          } else {
            console.warn('⚠️ Failed to sync conversation data, but continuing...');
          }
        } catch (syncError) {
          console.warn('⚠️ Error syncing conversation data:', syncError);
          // Don't block the flow for sync errors
        }

        // Small delay to ensure sync completes before redirect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        const error = await response.json().catch(() => ({}));
        console.warn('⚠️ Failed to end Tavus conversation:', {
          status: response.status,
          error: error,
          sentData: {
            conversationId: demo.tavus_conversation_id,
            demoId: demo.id,
          },
        });
        // Don't block the UI flow for this error
      }
    } catch (error) {
      console.warn('⚠️ Error ending Tavus conversation:', error);
      // Don't block the UI flow for this error
    }
  }

  setUiState(UIState.IDLE);
  // Redirect to the reporting page (configure page with reporting tab)
  router.push(`/demos/${demoId}/configure?tab=reporting`);
}
