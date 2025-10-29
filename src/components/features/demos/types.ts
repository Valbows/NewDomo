/**
 * Type definitions for demos feature components
 */

export interface Demo {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, any>;
  cta_url?: string;
  cta_text?: string;
}

export interface DemoListProps {
  demos: Demo[];
  loading?: boolean;
  error?: string | null;
  onDemoSelect?: (demo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onDemoEdit?: (demo: Demo) => void;
}

export interface DemoListItemProps {
  demo: Demo;
  onSelect?: (demo: Demo) => void;
  onDelete?: (demoId: string) => void;
  onEdit?: (demo: Demo) => void;
  showActions?: boolean;
}

export interface DemoFormProps {
  demo?: Partial<Demo>;
  onSubmit: (demoData: Partial<Demo>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

export interface DemoConfigurationProps {
  demoId: string;
  demo?: Demo;
  onSave?: (demo: Demo) => void;
}

// Demo status options
export const DEMO_STATUSES = ['active', 'inactive', 'draft'] as const;

// Demo configuration sections
export const DEMO_CONFIG_SECTIONS = {
  BASIC: 'basic',
  OBJECTIVES: 'objectives',
  CTA: 'cta',
  ADVANCED: 'advanced',
} as const;