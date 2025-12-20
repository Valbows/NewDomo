import { formatDate, formatDuration } from "@/app/demos/[demoId]/configure/components/reporting/utils/formatters";

describe("formatters", () => {
  describe("formatDate", () => {
    it("should format date as 'Mon DD, YYYY H:MM AM/PM' format (e.g., 'Jan 15, 2024 10:30 AM')", () => {
      const isoDate = "2024-01-15T10:30:00Z";
      const result = formatDate(isoDate);
      // Should be in format like "Jan 15, 2024 10:30 AM" (time may vary by timezone)
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M$/);
      expect(result).toContain("Jan");
      expect(result).toContain("2024");
    });

    it("should return em dash for undefined input", () => {
      expect(formatDate(undefined)).toBe("—");
    });

    it("should return em dash for null input", () => {
      expect(formatDate(null as any)).toBe("—");
    });

    it("should return em dash for empty string", () => {
      expect(formatDate("")).toBe("—");
    });

    it("should return em dash for invalid date string", () => {
      expect(formatDate("invalid-date")).toBe("—");
    });

    it("should format future dates correctly", () => {
      const futureDate = "2099-12-31T23:59:59Z";
      const result = formatDate(futureDate);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M$/);
      expect(result).toContain("Dec");
      expect(result).toContain("2099");
    });

    it("should format past dates correctly", () => {
      const pastDate = "2020-03-15T14:20:00Z";
      const result = formatDate(pastDate);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M$/);
      expect(result).toContain("Mar");
      expect(result).toContain("2020");
    });

    it("should use 3-letter month abbreviation", () => {
      // Test various months - using mid-day times to avoid timezone edge cases
      expect(formatDate("2024-02-15T12:00:00Z")).toContain("Feb");
      expect(formatDate("2024-06-15T12:00:00Z")).toContain("Jun");
      expect(formatDate("2024-09-20T12:00:00Z")).toContain("Sep");
      expect(formatDate("2024-12-25T12:00:00Z")).toContain("Dec");
    });
  });

  describe("formatDuration", () => {
    it("should format zero seconds", () => {
      expect(formatDuration(0)).toBe("—");
    });

    it("should format seconds less than a minute", () => {
      expect(formatDuration(45)).toBe("0:45");
    });

    it("should format exactly one minute", () => {
      expect(formatDuration(60)).toBe("1:00");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration(125)).toBe("2:05");
    });

    it("should format large durations", () => {
      expect(formatDuration(3661)).toBe("61:01"); // 1 hour, 1 minute, 1 second
    });

    it("should pad seconds with leading zero", () => {
      expect(formatDuration(63)).toBe("1:03");
      expect(formatDuration(600)).toBe("10:00");
    });

    it("should handle single digit seconds", () => {
      expect(formatDuration(65)).toBe("1:05");
    });

    it("should return em dash for null/undefined", () => {
      expect(formatDuration(null as any)).toBe("—");
      expect(formatDuration(undefined as any)).toBe("—");
    });
  });
});
