// Helper function to extract conversation ID from Tavus Daily URL
export function extractConversationIdFromUrl(url: string): string | null {
  try {
    // Tavus URLs are in format: https://tavus.daily.co/{conversation_id}
    const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Validate that a URL points to a Daily room (required by our CVI join logic)
export const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);
