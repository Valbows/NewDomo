/**
 * Type definitions for authentication feature components
 */

import { ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

export interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface WithAuthProps {
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

// Auth-related constants
export const AUTH_ROUTES = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/signup',
  DASHBOARD: '/dashboard',
  HOME: '/',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password should be at least 6 characters',
  NETWORK_ERROR: 'Network error, please try again',
} as const;