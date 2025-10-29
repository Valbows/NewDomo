/**
 * Type definitions for dashboard feature components
 */

export interface DashboardSummaryProps {
  totalDemos: number;
  activeDemos: number;
  totalConversations: number;
  recentActivity: ActivityItem[];
  loading?: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'demo_created' | 'conversation_started' | 'conversation_ended' | 'cta_clicked';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardStatsProps {
  stats: DashboardStats;
  loading?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange?: (range: string) => void;
}

export interface DashboardStats {
  totalDemos: number;
  activeDemos: number;
  totalConversations: number;
  totalCTAClicks: number;
  conversionRate: number;
  averageConversationDuration: number;
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
  limit?: number;
  showMore?: boolean;
  onShowMore?: () => void;
}

// Activity types for dashboard
export const ACTIVITY_TYPES = {
  DEMO_CREATED: 'demo_created',
  CONVERSATION_STARTED: 'conversation_started',
  CONVERSATION_ENDED: 'conversation_ended',
  CTA_CLICKED: 'cta_clicked',
} as const;

// Time range options
export const TIME_RANGES = ['day', 'week', 'month', 'year'] as const;