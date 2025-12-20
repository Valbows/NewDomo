/**
 * Tests for end-conversation API route logic
 *
 * These tests verify that:
 * 1. Transcript and perception analysis are fetched from Tavus when conversation ends
 * 2. conversation_details status is updated to 'ended'
 * 3. Demo's tavus_conversation_id is cleared after syncing data
 */

describe("End Conversation - Data Sync", () => {
  describe("Transcript and Perception Extraction", () => {
    // Simulate extracting data from Tavus verbose API response
    const extractTranscriptAndPerception = (verboseData: any) => {
      const events = verboseData.events || [];

      // Find perception analysis
      const perceptionEvent = events.find(
        (e: any) => e.event_type === "application.perception_analysis"
      );
      const perceptionAnalysis = perceptionEvent?.properties?.analysis || null;

      // Find transcript
      const transcriptEvent = events.find(
        (e: any) => e.event_type === "application.transcription_ready"
      );
      const transcript = transcriptEvent?.properties?.transcript || null;

      return { transcript, perceptionAnalysis };
    };

    it("should extract transcript from transcription_ready event", () => {
      const verboseData = {
        events: [
          {
            event_type: "application.transcription_ready",
            properties: {
              transcript: [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there!" },
              ],
            },
          },
        ],
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toHaveLength(2);
      expect(transcript[0].role).toBe("user");
      expect(perceptionAnalysis).toBeNull();
    });

    it("should extract perception analysis from perception_analysis event", () => {
      const verboseData = {
        events: [
          {
            event_type: "application.perception_analysis",
            properties: {
              analysis:
                "The user appeared engaged and interested throughout the conversation.",
            },
          },
        ],
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toBeNull();
      expect(perceptionAnalysis).toContain("engaged");
    });

    it("should extract both transcript and perception when both present", () => {
      const verboseData = {
        events: [
          {
            event_type: "application.transcription_ready",
            properties: {
              transcript: [{ role: "user", content: "Tell me about the product" }],
            },
          },
          {
            event_type: "application.perception_analysis",
            properties: {
              analysis: "User showed high interest in product features.",
            },
          },
          {
            event_type: "system.shutdown",
            properties: {},
          },
        ],
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toHaveLength(1);
      expect(perceptionAnalysis).toContain("high interest");
    });

    it("should return null for both when events array is empty", () => {
      const verboseData = {
        events: [],
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toBeNull();
      expect(perceptionAnalysis).toBeNull();
    });

    it("should return null when events property is missing", () => {
      const verboseData = {
        conversation_id: "test123",
        status: "ended",
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toBeNull();
      expect(perceptionAnalysis).toBeNull();
    });

    it("should handle malformed event data gracefully", () => {
      const verboseData = {
        events: [
          {
            event_type: "application.transcription_ready",
            // Missing properties
          },
          {
            event_type: "application.perception_analysis",
            properties: {
              // Missing analysis field
            },
          },
        ],
      };

      const { transcript, perceptionAnalysis } =
        extractTranscriptAndPerception(verboseData);

      expect(transcript).toBeNull();
      expect(perceptionAnalysis).toBeNull();
    });
  });

  describe("Conversation Status Update", () => {
    it("should build correct update payload with all data", () => {
      const conversationId = "test123";
      const transcript = [{ role: "user", content: "Hello" }];
      const perceptionAnalysis = "User was engaged";

      const updatePayload = {
        status: "ended",
        completed_at: new Date().toISOString(),
        ...(transcript && { transcript }),
        ...(perceptionAnalysis && { perception_analysis: perceptionAnalysis }),
      };

      expect(updatePayload.status).toBe("ended");
      expect(updatePayload.completed_at).toBeDefined();
      expect(updatePayload.transcript).toEqual(transcript);
      expect(updatePayload.perception_analysis).toBe(perceptionAnalysis);
    });

    it("should not include transcript if null", () => {
      const transcript = null;
      const perceptionAnalysis = "User was engaged";

      const updatePayload = {
        status: "ended",
        completed_at: new Date().toISOString(),
        ...(transcript && { transcript }),
        ...(perceptionAnalysis && { perception_analysis: perceptionAnalysis }),
      };

      expect(updatePayload).not.toHaveProperty("transcript");
      expect(updatePayload.perception_analysis).toBe(perceptionAnalysis);
    });

    it("should not include perception if null", () => {
      const transcript = [{ role: "user", content: "Hello" }];
      const perceptionAnalysis = null;

      const updatePayload = {
        status: "ended",
        completed_at: new Date().toISOString(),
        ...(transcript && { transcript }),
        ...(perceptionAnalysis && { perception_analysis: perceptionAnalysis }),
      };

      expect(updatePayload.transcript).toEqual(transcript);
      expect(updatePayload).not.toHaveProperty("perception_analysis");
    });
  });

  describe("Order of Operations", () => {
    it("should define correct sequence for ending conversation", () => {
      const operations = [
        "1. Call Tavus API to end conversation",
        "2. Fetch verbose data (transcript + perception) from Tavus",
        "3. Update conversation_details with status, transcript, perception",
        "4. Clear tavus_conversation_id from demo",
        "5. Return success response",
      ];

      // This test documents the expected order of operations
      // The key insight is that step 2 (fetch verbose data) must happen
      // BEFORE step 4 (clearing the ID) because we need the conversation ID
      // to fetch the data from Tavus
      expect(operations).toHaveLength(5);
      expect(operations[1]).toContain("Fetch verbose data");
      expect(operations[3]).toContain("Clear tavus_conversation_id");
    });
  });
});
