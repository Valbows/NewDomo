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

export interface ContactInfo {
  id: string;
  conversation_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  objective_name: string;
  event_type: string;
  raw_payload: any;
  received_at: string;
}

export interface ProductInterestData {
  id: string;
  conversation_id: string;
  objective_name: string;
  primary_interest: string | null;
  pain_points: string[] | null;
  event_type: string;
  raw_payload: any;
  received_at: string;
}

export interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  objective_name: string;
  requested_videos: string[] | null;
  videos_shown: string[] | null;
  event_type: string;
  raw_payload: any;
  received_at: string;
  updated_at?: string;
}

export interface CtaTrackingData {
  id: string;
  conversation_id: string;
  demo_id: string;
  cta_shown_at: string | null;
  cta_clicked_at: string | null;
  cta_url: string | null;
}

export interface ConversationDataSets {
  contactInfo: Record<string, ContactInfo>;
  productInterestData: Record<string, ProductInterestData>;
  videoShowcaseData: Record<string, VideoShowcaseData>;
  ctaTrackingData: Record<string, CtaTrackingData>;
}

export interface ConversationStats {
  totalConversations: number;
  completedConversations: number;
  averageDuration: number;
  status: string;
}