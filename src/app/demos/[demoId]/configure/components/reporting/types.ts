import { Demo } from "@/app/demos/[demoId]/configure/types";

export interface ReportingProps {
  demo: Demo | null;
}

export interface ConversationDetail {
  id: string;
  tavus_conversation_id: string;
  conversation_name: string;
  transcript: any;
  perception_analysis: any;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptEntry {
  timestamp: number;
  speaker: string;
  text: string;
}

export interface PerceptionMetrics {
  overall_score: number;
  engagement_score: number;
  sentiment_score: number;
  comprehension_score: number;
  interest_level: string;
  key_insights: string[];
}

export interface ContactInfo {
  id: string;
  conversation_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  received_at: string;
}

export interface ProductInterestData {
  id: string;
  conversation_id: string;
  primary_interest: string | null;
  pain_points: string[] | null;
  received_at: string;
}

export interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  videos_shown: string[] | null;
  objective_name: string;
  received_at: string;
}

export interface CtaTrackingData {
  id: string;
  conversation_id: string;
  demo_id: string;
  cta_shown_at: string | null;
  cta_clicked_at: string | null;
  cta_url: string | null;
}

export interface DomoScoreBreakdown {
  contactConfirmation: boolean;
  reasonForVisit: boolean;
  platformFeatureInterest: boolean;
  ctaExecution: boolean;
  perceptionAnalysis: boolean;
}

export interface DomoScoreResult {
  score: number;
  maxScore: number;
  breakdown: DomoScoreBreakdown;
}
