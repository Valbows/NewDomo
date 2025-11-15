import { supabase } from "@/lib/supabase";
import { ConversationDetail, ConversationDataSets } from "./types";

export class ReportingDataService {
  static async fetchConversationData(demoId: string): Promise<{
    conversations: ConversationDetail[];
    dataSets: ConversationDataSets;
  }> {
    try {
      // Fetch conversations
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversation_details")
          .select("*")
          .eq("demo_id", demoId)
          .order("started_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      const conversations = conversationsData || [];

      // Debug: Check transcript data in conversations
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Conversation transcript debug:', conversations.slice(0, 3).map(c => ({
          id: c.id,
          hasTranscript: !!c.transcript,
          transcriptType: typeof c.transcript,
          transcriptLength: Array.isArray(c.transcript) ? c.transcript.length : (c.transcript ? String(c.transcript).length : 0),
          transcriptSample: c.transcript ? (Array.isArray(c.transcript) ? c.transcript.slice(0, 1) : String(c.transcript).substring(0, 100)) : null
        })));
      }

      // Fetch related data for each conversation
      const conversationIds = conversations.map((c) => c.tavus_conversation_id) || [];

      if (conversationIds.length === 0) {
        return {
          conversations,
          dataSets: {
            contactInfo: {},
            productInterestData: {},
            videoShowcaseData: {},
            ctaTrackingData: {},
          }
        };
      }

      // Fetch all related data in parallel
      const [
        { data: contactData },
        { data: productData },
        { data: videoData },
        { data: ctaData }
      ] = await Promise.all([
        supabase
          .from("qualification_data")
          .select("*")
          .in("conversation_id", conversationIds),
        supabase
          .from("product_interest_data")
          .select("*")
          .in("conversation_id", conversationIds),
        supabase
          .from("video_showcase_data")
          .select("*")
          .in("conversation_id", conversationIds),
        supabase
          .from("cta_tracking")
          .select("*")
          .in("conversation_id", conversationIds)
      ]);

      // Convert arrays to lookup objects
      const dataSets: ConversationDataSets = {
        contactInfo: contactData?.reduce(
          (acc, item) => ({ ...acc, [item.conversation_id]: item }),
          {}
        ) || {},
        productInterestData: productData?.reduce(
          (acc, item) => ({ ...acc, [item.conversation_id]: item }),
          {}
        ) || {},
        videoShowcaseData: videoData?.reduce(
          (acc, item) => ({ ...acc, [item.conversation_id]: item }),
          {}
        ) || {},
        ctaTrackingData: ctaData?.reduce(
          (acc, item) => ({ ...acc, [item.conversation_id]: item }),
          {}
        ) || {},
      };

      return { conversations, dataSets };

    } catch (error) {
      console.error("Error fetching conversation data:", error);
      throw error;
    }
  }

  static async syncConversations(demoId: string): Promise<any> {
    try {
      const response = await fetch(`/api/sync-tavus-conversations?demoId=${demoId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to sync conversations");
      }

      const result = await response.json();
      console.log('✅ Sync completed:', result);
      
      // Show success message if in development
      if (process.env.NODE_ENV === 'development') {
        alert(`Sync completed: ${result.conversations_synced}/${result.conversations_total} conversations updated`);
      }

      return result;
    } catch (error) {
      console.error("Error syncing conversations:", error);
      if (process.env.NODE_ENV === 'development') {
        alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }
}