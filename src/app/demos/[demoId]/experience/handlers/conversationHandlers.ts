import { UIState } from '@/lib/tavus/UI_STATES';
import type { Demo } from '../types';

export async function handleConversationEnd(
  demo: Demo | null,
  setUiState: (state: UIState) => void,
  router: any,
  demoId: string
) {

  // End the Tavus conversation via API if we have a conversation ID
  if (demo?.tavus_conversation_id) {
    try {
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

        // Automatically sync conversation data after ending
        try {
          const syncResponse = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
            method: 'GET',
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
          } else {
          }
        } catch (syncError) {
          // Don't block the flow for sync errors
        }

        // Small delay to ensure sync completes before redirect
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        const error = await response.json().catch(() => ({}));
        // Don't block the UI flow for this error
      }
    } catch (error) {
      // Don't block the UI flow for this error
    }
  }

  setUiState(UIState.IDLE);
  // Redirect to the reporting page (configure page with reporting tab)
  router.push(`/demos/${demoId}/configure?tab=reporting`);
}
