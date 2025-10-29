/**
 * Type definitions for layout components
 */

import { ReactNode } from 'react';

export interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export interface HeaderProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  navigation?: NavigationItem[];
  onSignOut?: () => void;
  className?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number;
}

export interface SidebarProps {
  navigation: NavigationItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface FooterProps {
  links?: FooterLink[];
  copyright?: string;
  className?: string;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

// Navigation sections
export const NAV_SECTIONS = {
  MAIN: 'main',
  ADMIN: 'admin',
  USER: 'user',
} as const;

// Layout breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
} as const;