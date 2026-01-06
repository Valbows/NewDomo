import { useState } from "react";

interface UseConversationSyncProps {
  demoId: string | undefined;
  onSyncComplete?: () => Promise<void>;
}

interface UseConversationSyncReturn {
  syncing: boolean;
  syncError: string | null;
  syncConversations: () => Promise<void>;
}

export function useConversationSync({
  demoId,
  onSyncComplete,
}: UseConversationSyncProps): UseConversationSyncReturn {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncConversations = async () => {
    if (!demoId) return;

    setSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch(`/api/sync-tavus-conversations?demoId=${demoId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to sync conversations");
      }

      const result = await response.json();

      // Call the onSyncComplete callback to refresh data
      if (onSyncComplete) {
        await onSyncComplete();
      }

      // Show success message with details about what was synced
      const syncedCount = result.results?.length || 0;
      const hasTranscript = result.results?.some((r: any) => r.has_transcript) || false;
      const hasPerception = result.results?.some((r: any) => r.has_perception) || false;

    } catch (err) {
      console.error("Failed to sync conversations:", err);
      setSyncError("Failed to sync conversations from Domo");
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    syncError,
    syncConversations,
  };
}
