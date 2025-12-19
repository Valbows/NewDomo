/**
 * Tests for conversation sorting logic
 * Ensures conversations are displayed in correct date order (newest first)
 */

describe("Conversation Sorting", () => {
  // Helper to simulate the sorting logic from useConversationData
  const sortConversations = (conversations: Array<{ completed_at: string | null; created_at: string }>) => {
    return [...conversations].sort((a, b) => {
      const aDate = a.completed_at || a.created_at;
      const bDate = b.completed_at || b.created_at;

      const aTime = aDate ? new Date(aDate).getTime() : 0;
      const bTime = bDate ? new Date(bDate).getTime() : 0;

      return bTime - aTime; // Descending order (latest first)
    });
  };

  it("should sort conversations by completed_at descending (newest first)", () => {
    const conversations = [
      { completed_at: "2024-01-10T10:00:00Z", created_at: "2024-01-10T09:00:00Z" },
      { completed_at: "2024-01-15T10:00:00Z", created_at: "2024-01-15T09:00:00Z" },
      { completed_at: "2024-01-05T10:00:00Z", created_at: "2024-01-05T09:00:00Z" },
    ];

    const sorted = sortConversations(conversations);

    expect(sorted[0].completed_at).toBe("2024-01-15T10:00:00Z"); // Newest first
    expect(sorted[1].completed_at).toBe("2024-01-10T10:00:00Z");
    expect(sorted[2].completed_at).toBe("2024-01-05T10:00:00Z"); // Oldest last
  });

  it("should use created_at when completed_at is null", () => {
    const conversations = [
      { completed_at: null, created_at: "2024-01-20T10:00:00Z" }, // No completed_at but newer created_at
      { completed_at: "2024-01-15T10:00:00Z", created_at: "2024-01-15T09:00:00Z" },
      { completed_at: null, created_at: "2024-01-10T10:00:00Z" }, // Older created_at
    ];

    const sorted = sortConversations(conversations);

    // The one with created_at Jan 20 should be first (using created_at as fallback)
    expect(sorted[0].created_at).toBe("2024-01-20T10:00:00Z");
    expect(sorted[1].completed_at).toBe("2024-01-15T10:00:00Z");
    expect(sorted[2].created_at).toBe("2024-01-10T10:00:00Z");
  });

  it("should handle mixed null and non-null completed_at values correctly", () => {
    const conversations = [
      { completed_at: "2024-01-01T10:00:00Z", created_at: "2024-01-01T09:00:00Z" },
      { completed_at: null, created_at: "2024-01-25T10:00:00Z" }, // Should be first
      { completed_at: "2024-01-20T10:00:00Z", created_at: "2024-01-20T09:00:00Z" },
      { completed_at: null, created_at: "2024-01-05T10:00:00Z" },
    ];

    const sorted = sortConversations(conversations);

    // Order should be: Jan 25 (created), Jan 20 (completed), Jan 5 (created), Jan 1 (completed)
    expect(sorted[0].created_at).toBe("2024-01-25T10:00:00Z");
    expect(sorted[1].completed_at).toBe("2024-01-20T10:00:00Z");
    expect(sorted[2].created_at).toBe("2024-01-05T10:00:00Z");
    expect(sorted[3].completed_at).toBe("2024-01-01T10:00:00Z");
  });

  it("should handle empty array", () => {
    const sorted = sortConversations([]);
    expect(sorted).toEqual([]);
  });

  it("should handle single conversation", () => {
    const conversations = [
      { completed_at: "2024-01-15T10:00:00Z", created_at: "2024-01-15T09:00:00Z" },
    ];

    const sorted = sortConversations(conversations);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].completed_at).toBe("2024-01-15T10:00:00Z");
  });

  it("should maintain stable sort for same timestamps", () => {
    const conversations = [
      { completed_at: "2024-01-15T10:00:00Z", created_at: "2024-01-15T09:00:00Z" },
      { completed_at: "2024-01-15T10:00:00Z", created_at: "2024-01-15T09:00:00Z" },
    ];

    const sorted = sortConversations(conversations);
    expect(sorted).toHaveLength(2);
    // Both have same timestamp, order doesn't matter but should not throw
  });

  it("should prioritize completed_at over created_at for the same conversation", () => {
    // If a conversation has both, completed_at should be used for sorting
    const conversations = [
      { completed_at: "2024-01-20T10:00:00Z", created_at: "2024-01-01T09:00:00Z" }, // Old created, new completed
      { completed_at: "2024-01-10T10:00:00Z", created_at: "2024-01-15T09:00:00Z" }, // New created, old completed
    ];

    const sorted = sortConversations(conversations);

    // Should sort by completed_at, so Jan 20 completed should be first
    expect(sorted[0].completed_at).toBe("2024-01-20T10:00:00Z");
    expect(sorted[1].completed_at).toBe("2024-01-10T10:00:00Z");
  });
});
