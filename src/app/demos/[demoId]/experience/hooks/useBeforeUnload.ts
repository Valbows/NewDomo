import { useEffect } from 'react';

interface UseBeforeUnloadParams {
  conversationId: string | null | undefined;
  demoId: string | null | undefined;
}

export function useBeforeUnload({ conversationId, demoId }: UseBeforeUnloadParams): void {
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (conversationId) {
        // Use sendBeacon for reliable delivery during page unload
        const endPayload = JSON.stringify({
          conversationId: conversationId,
          demoId: demoId,
        });

        try {
          navigator.sendBeacon('/api/end-conversation', endPayload);
        } catch (error) {
          console.warn('Failed to send conversation end beacon:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [conversationId, demoId]);
}
