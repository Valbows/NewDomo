import {
  isValidPerceptionAnalysis,
  calculateDomoScore,
  getScoreColor,
  getScoreLabel,
} from "@/app/demos/[demoId]/configure/components/reporting/utils/domo-score";
import {
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "@/app/demos/[demoId]/configure/components/reporting/types";

describe("domo-score", () => {
  describe("isValidPerceptionAnalysis", () => {
    it("should return false for null/undefined", () => {
      expect(isValidPerceptionAnalysis(null)).toBe(false);
      expect(isValidPerceptionAnalysis(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidPerceptionAnalysis("")).toBe(false);
      expect(isValidPerceptionAnalysis("   ")).toBe(false);
    });

    it("should return false for very short strings (< 10 chars)", () => {
      expect(isValidPerceptionAnalysis("short")).toBe(false);
      expect(isValidPerceptionAnalysis("abc")).toBe(false);
    });

    it("should return true for any string with 10+ characters", () => {
      expect(isValidPerceptionAnalysis("user appears engaged and focused")).toBe(true);
      expect(isValidPerceptionAnalysis("completely black screen")).toBe(true); // Still counts as data
      expect(isValidPerceptionAnalysis("some analysis text here")).toBe(true);
    });

    it("should return true for object with any keys", () => {
      expect(isValidPerceptionAnalysis({ overall_score: 0.8 })).toBe(true);
      expect(isValidPerceptionAnalysis({ engagement_score: 0.9 })).toBe(true);
      expect(isValidPerceptionAnalysis({ key_insights: ["engaged", "focused"] })).toBe(true);
      expect(isValidPerceptionAnalysis({ any_key: "any_value" })).toBe(true);
    });

    it("should return false for empty object", () => {
      expect(isValidPerceptionAnalysis({})).toBe(false);
    });

    it("should return true for non-empty arrays", () => {
      expect(isValidPerceptionAnalysis(["item1", "item2"])).toBe(true);
      expect(isValidPerceptionAnalysis([{ data: "value" }])).toBe(true);
    });

    it("should return false for empty arrays", () => {
      expect(isValidPerceptionAnalysis([])).toBe(false);
    });
  });

  describe("calculateDomoScore", () => {
    const mockContact: ContactInfo = {
      id: "1",
      conversation_id: "conv-1",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      position: "Developer",
      received_at: "2024-01-01",
    };

    const mockProductInterest: ProductInterestData = {
      id: "1",
      conversation_id: "conv-1",
      primary_interest: "Product features",
      pain_points: ["Integration", "Scalability"],
      received_at: "2024-01-01",
    };

    const mockVideoShowcase: VideoShowcaseData = {
      id: "1",
      conversation_id: "conv-1",
      videos_shown: ["Demo 1", "Demo 2"],
      objective_name: "showcase",
      received_at: "2024-01-01",
    };

    const mockCtaTracking: CtaTrackingData = {
      id: "1",
      conversation_id: "conv-1",
      demo_id: "demo-1",
      cta_shown_at: "2024-01-01T10:00:00Z",
      cta_clicked_at: "2024-01-01T10:05:00Z",
      cta_url: "https://example.com",
    };

    const validPerception = "user appears engaged and focused";

    it("should return perfect score 5/5 with all criteria met", () => {
      const result = calculateDomoScore(
        mockContact,
        mockProductInterest,
        mockVideoShowcase,
        mockCtaTracking,
        validPerception
      );

      expect(result.score).toBe(5);
      expect(result.maxScore).toBe(5);
      expect(result.breakdown.contactConfirmation).toBe(true);
      expect(result.breakdown.reasonForVisit).toBe(true);
      expect(result.breakdown.platformFeatureInterest).toBe(true);
      expect(result.breakdown.ctaExecution).toBe(true);
      expect(result.breakdown.perceptionAnalysis).toBe(true);
    });

    it("should return 0/5 with no criteria met", () => {
      const result = calculateDomoScore(null, null, null, null, null);

      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(5);
      expect(result.breakdown.contactConfirmation).toBe(false);
      expect(result.breakdown.reasonForVisit).toBe(false);
      expect(result.breakdown.platformFeatureInterest).toBe(false);
      expect(result.breakdown.ctaExecution).toBe(false);
      expect(result.breakdown.perceptionAnalysis).toBe(false);
    });

    it("should award point for contact with email only", () => {
      const contactEmailOnly = { ...mockContact, first_name: null, last_name: null };
      const result = calculateDomoScore(contactEmailOnly, null, null, null, null);
      expect(result.breakdown.contactConfirmation).toBe(true);
      expect(result.score).toBe(1);
    });

    it("should award point for contact with name only", () => {
      const contactNameOnly = { ...mockContact, email: null };
      const result = calculateDomoScore(contactNameOnly, null, null, null, null);
      expect(result.breakdown.contactConfirmation).toBe(true);
      expect(result.score).toBe(1);
    });

    it("should award point for primary interest only", () => {
      const interestOnly = { ...mockProductInterest, pain_points: null };
      const result = calculateDomoScore(null, interestOnly, null, null, null);
      expect(result.breakdown.reasonForVisit).toBe(true);
      expect(result.score).toBe(1);
    });

    it("should award point for pain points only", () => {
      const painPointsOnly = { ...mockProductInterest, primary_interest: null };
      const result = calculateDomoScore(null, painPointsOnly, null, null, null);
      expect(result.breakdown.reasonForVisit).toBe(true);
      expect(result.score).toBe(1);
    });

    it("should not award CTA point if not clicked", () => {
      const ctaShownOnly = { ...mockCtaTracking, cta_clicked_at: null };
      const result = calculateDomoScore(null, null, null, ctaShownOnly, null);
      expect(result.breakdown.ctaExecution).toBe(false);
      expect(result.score).toBe(0);
    });

    it("should award video showcase point only with videos shown", () => {
      const result = calculateDomoScore(null, null, mockVideoShowcase, null, null);
      expect(result.breakdown.platformFeatureInterest).toBe(true);
      expect(result.score).toBe(1);
    });

    it("should not award video showcase point with empty videos array", () => {
      const emptyVideos = { ...mockVideoShowcase, videos_shown: [] };
      const result = calculateDomoScore(null, null, emptyVideos, null, null);
      expect(result.breakdown.platformFeatureInterest).toBe(false);
      expect(result.score).toBe(0);
    });

    it("should calculate partial scores correctly", () => {
      const result = calculateDomoScore(
        mockContact,
        mockProductInterest,
        null, // No video
        null, // No CTA
        null  // No perception
      );
      expect(result.score).toBe(2);
    });
  });

  describe("getScoreColor", () => {
    it("should return green for excellent scores (4-5)", () => {
      expect(getScoreColor(5)).toContain("green");
      expect(getScoreColor(4)).toContain("green");
    });

    it("should return blue for good scores (3)", () => {
      expect(getScoreColor(3)).toContain("blue");
    });

    it("should return yellow for fair scores (2)", () => {
      expect(getScoreColor(2)).toContain("yellow");
    });

    it("should return red for poor scores (0-1)", () => {
      expect(getScoreColor(1)).toContain("red");
      expect(getScoreColor(0)).toContain("red");
    });
  });

  describe("getScoreLabel", () => {
    it("should return 'Excellent' for scores 4-5", () => {
      expect(getScoreLabel(5)).toBe("Excellent");
      expect(getScoreLabel(4)).toBe("Excellent");
    });

    it("should return 'Good' for score 3", () => {
      expect(getScoreLabel(3)).toBe("Good");
    });

    it("should return 'Fair' for score 2", () => {
      expect(getScoreLabel(2)).toBe("Fair");
    });

    it("should return 'Poor' for scores 0-1", () => {
      expect(getScoreLabel(1)).toBe("Poor");
      expect(getScoreLabel(0)).toBe("Poor");
    });
  });
});
