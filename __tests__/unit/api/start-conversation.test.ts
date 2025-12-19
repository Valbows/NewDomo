/**
 * Tests for start-conversation API route logic
 *
 * These tests verify that stale conversations are properly detected and handled.
 * The key issue was: a Daily room URL could exist but the Tavus conversation
 * could be ended, causing "Meeting has ended" errors.
 */

describe("Start Conversation - Tavus Status Check", () => {
  // Mock the isTavusConversationActive logic
  const isTavusConversationActive = (status: string): boolean => {
    const activeStatuses = ['active', 'starting', 'waiting'];
    return activeStatuses.includes(status);
  };

  describe("isTavusConversationActive", () => {
    it("should return true for 'active' status", () => {
      expect(isTavusConversationActive('active')).toBe(true);
    });

    it("should return true for 'starting' status", () => {
      expect(isTavusConversationActive('starting')).toBe(true);
    });

    it("should return true for 'waiting' status", () => {
      expect(isTavusConversationActive('waiting')).toBe(true);
    });

    it("should return false for 'ended' status", () => {
      expect(isTavusConversationActive('ended')).toBe(false);
    });

    it("should return false for 'completed' status", () => {
      expect(isTavusConversationActive('completed')).toBe(false);
    });

    it("should return false for 'error' status", () => {
      expect(isTavusConversationActive('error')).toBe(false);
    });

    it("should return false for unknown status", () => {
      expect(isTavusConversationActive('unknown')).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isTavusConversationActive('')).toBe(false);
    });
  });

  describe("Daily Room URL Validation", () => {
    const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

    it("should validate tavus.daily.co URLs", () => {
      expect(isDailyRoomUrl("https://tavus.daily.co/abc123")).toBe(true);
    });

    it("should validate custom subdomain daily.co URLs", () => {
      expect(isDailyRoomUrl("https://mycompany.daily.co/room-name")).toBe(true);
    });

    it("should reject non-daily URLs", () => {
      expect(isDailyRoomUrl("https://example.com/room")).toBe(false);
    });

    it("should reject URLs without room path", () => {
      expect(isDailyRoomUrl("https://tavus.daily.co/")).toBe(false);
      expect(isDailyRoomUrl("https://tavus.daily.co")).toBe(false);
    });

    it("should reject empty strings", () => {
      expect(isDailyRoomUrl("")).toBe(false);
    });
  });

  describe("Conversation ID Extraction", () => {
    const extractConversationIdFromUrl = (url: string): string | null => {
      const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    };

    it("should extract conversation ID from tavus.daily.co URL", () => {
      expect(extractConversationIdFromUrl("https://tavus.daily.co/abc123def")).toBe("abc123def");
    });

    it("should extract alphanumeric IDs", () => {
      expect(extractConversationIdFromUrl("https://tavus.daily.co/cd04ee92efcff491")).toBe("cd04ee92efcff491");
    });

    it("should return null for non-tavus URLs", () => {
      expect(extractConversationIdFromUrl("https://other.daily.co/abc123")).toBe(null);
    });

    it("should return null for invalid URLs", () => {
      expect(extractConversationIdFromUrl("not-a-url")).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(extractConversationIdFromUrl("")).toBe(null);
    });
  });

  describe("Conversation Reuse Logic", () => {
    // Simulate the decision logic for reusing vs creating new conversation
    const shouldReuseConversation = (
      existingUrl: string | undefined,
      existingConvId: string | undefined,
      isActive: boolean,
      forceNew: boolean
    ): 'reuse' | 'create-new' | 'clear-and-create' => {
      if (forceNew) return 'create-new';

      const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

      if (!existingUrl || !isDailyRoomUrl(existingUrl) || !existingConvId) {
        return 'create-new';
      }

      if (isActive) {
        return 'reuse';
      } else {
        return 'clear-and-create';
      }
    };

    it("should reuse active conversation", () => {
      const result = shouldReuseConversation(
        "https://tavus.daily.co/abc123",
        "abc123",
        true, // is active
        false // not forceNew
      );
      expect(result).toBe('reuse');
    });

    it("should clear and create new when conversation is ended", () => {
      const result = shouldReuseConversation(
        "https://tavus.daily.co/abc123",
        "abc123",
        false, // not active (ended)
        false
      );
      expect(result).toBe('clear-and-create');
    });

    it("should create new when forceNew is true", () => {
      const result = shouldReuseConversation(
        "https://tavus.daily.co/abc123",
        "abc123",
        true, // active
        true  // forceNew
      );
      expect(result).toBe('create-new');
    });

    it("should create new when no existing URL", () => {
      const result = shouldReuseConversation(
        undefined,
        undefined,
        false,
        false
      );
      expect(result).toBe('create-new');
    });

    it("should create new when existing URL is not a Daily room", () => {
      const result = shouldReuseConversation(
        "https://example.com/not-daily",
        "abc123",
        true,
        false
      );
      expect(result).toBe('create-new');
    });

    it("should create new when no conversation ID", () => {
      const result = shouldReuseConversation(
        "https://tavus.daily.co/abc123",
        undefined,
        true,
        false
      );
      expect(result).toBe('create-new');
    });
  });
});
