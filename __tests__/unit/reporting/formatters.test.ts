import { formatDate, formatDuration } from "@/app/demos/[demoId]/configure/components/reporting/utils/formatters";

describe("formatters", () => {
  describe("formatDate", () => {
    it("should format valid ISO date string", () => {
      const isoDate = "2024-01-15T10:30:00Z";
      const result = formatDate(isoDate);
      expect(result).toMatch(/Jan|1\/15|2024|10:30/i); // Flexible matching for different locales
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

    it("should handle future dates", () => {
      const futureDate = "2099-12-31T23:59:59Z";
      const result = formatDate(futureDate);
      expect(result).toMatch(/2099|Dec|12\/31/i);
    });

    it("should handle past dates", () => {
      const pastDate = "2020-03-15T14:20:00Z";
      const result = formatDate(pastDate);
      expect(result).toMatch(/2020|Mar|3\/15/i);
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
