import { useState, useEffect, useRef } from "react";

interface UseConversationSyncProps {
  demoId: string | undefined;
  onSyncComplete?: () => Promise<void>;
  autoSync?: boolean; // Auto-sync on mount
}

interface UseConversationSyncReturn {
  syncing: boolean;
  syncError: string | null;
  syncConversations: () => Promise<void>;
  initialSyncComplete: boolean; // Track if initial auto-sync finished
}

export function useConversationSync({
  demoId,
  onSyncComplete,
  autoSync = false,
}: UseConversationSyncProps): UseConversationSyncReturn {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [initialSyncComplete, setInitialSyncComplete] = useState(!autoSync); // If no autoSync, consider it complete
  const hasAutoSynced = useRef(false);

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
      setInitialSyncComplete(true);
    }
  };

  // Auto-sync on mount if enabled
  useEffect(() => {
    if (autoSync && demoId && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      syncConversations();
    }
  }, [autoSync, demoId]);

  return {
    syncing,
    syncError,
    syncConversations,
    initialSyncComplete,
  };
}
