/**
 * Type definitions for shared UI components
 */

import { ReactNode } from 'react';

export interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  backgroundImage?: string;
  className?: string;
}

export interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features: FeatureItem[];
  layout?: 'grid' | 'list' | 'cards';
  columns?: 2 | 3 | 4;
  className?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
  image?: string;
  href?: string;
}

export interface EnsureRavenButtonProps {
  demoId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface RavenDebugPanelProps {
  demoId: string;
  conversationId?: string;
  showLogs?: boolean;
  onClose?: () => void;
}

// Button variants and sizes
export const BUTTON_VARIANTS = ['primary', 'secondary', 'outline'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

// Layout options
export const LAYOUT_OPTIONS = ['grid', 'list', 'cards'] as const;
export const GRID_COLUMNS = [2, 3, 4] as const;