/**
 * Authentication Service Implementation
 * 
 * Handles core authentication operations including sign-in, sign-up,
 * and session management using Supabase as the authentication provider.
 */

import { supabase } from '@/lib/supabase';
import { getErrorMessage, logError } from '@/lib/errors';
import type { 
  IAuthService, 
  SignInCredentials, 
  SignUpCredentials, 
  AuthResult, 
  SessionResult,
  User,
  AuthSession
} from './types';

export class AuthService implements IAuthService {
  private getSupabase() {
    return supabase;
  }

  private isE2EMode(): boolean {
    return process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  }

  /**
   * Sign in a user with email and password
   * @param credentials - User sign-in credentials
   * @returns Promise resolving to authentication result
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    // Handle E2E mode with mock authentication
    if (this.isE2EMode()) {
      console.log('🧪 E2E mode: Mock sign-in successful');
      const user: User = {
        id: 'e2e-user',
        email: credentials.email,
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const session: AuthSession = {
        user,
        accessToken: 'e2e-mock-token',
        refreshToken: 'e2e-mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      return {
        success: true,
        user,
        session
      };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        logError(error, 'Authentication sign-in failed');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Authentication failed - no user or session returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: true,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      const session: AuthSession = {
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      };

      return {
        success: true,
        user,
        session
      };

    } catch (error: unknown) {
      logError(error, 'Sign-in service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Sign up a new user with email and password
   * @param credentials - User sign-up credentials
   * @returns Promise resolving to authentication result
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    // Handle E2E mode with mock authentication
    if (this.isE2EMode()) {
      console.log('🧪 E2E mode: Mock sign-up successful');
      const user: User = {
        id: 'e2e-user-new',
        email: credentials.email,
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const session: AuthSession = {
        user,
        accessToken: 'e2e-mock-token',
        refreshToken: 'e2e-mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      return {
        success: true,
        user,
        session
      };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation redirect for now
        }
      });

      if (error) {
        logError(error, 'Authentication sign-up failed');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Sign-up failed - no user returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: !!data.session,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      let session: AuthSession | undefined;
      if (data.session) {
        session = {
          user,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at
        };
      }

      return {
        success: true,
        user,
        session
      };

    } catch (error: unknown) {
      logError(error, 'Sign-up service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Sign out the current user
   * @returns Promise resolving to sign-out result
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    // Handle E2E mode with mock sign-out
    if (this.isE2EMode()) {
      console.log('🧪 E2E mode: Mock sign-out successful');
      return { success: true };
    }

    try {
      const supabase = this.getSupabase();
      const { error } = await supabase.auth.signOut();

      if (error) {
        logError(error, 'Authentication sign-out failed');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      return { success: true };

    } catch (error: unknown) {
      logError(error, 'Sign-out service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Get the current user session
   * @returns Promise resolving to session result
   */
  async getCurrentSession(): Promise<SessionResult> {
    // Handle E2E mode with mock session
    if (this.isE2EMode()) {
      console.log('🧪 E2E mode: Mock session retrieved');
      const user: User = {
        id: 'e2e-user',
        email: 'e2e@example.com',
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const session: AuthSession = {
        user,
        accessToken: 'e2e-mock-token',
        refreshToken: 'e2e-mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      return {
        success: true,
        session
      };
    }

    try {
      const supabase = this.getSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logError(error, 'Failed to get current session');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!session || !session.user) {
        return {
          success: true,
          session: undefined
        };
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        isAuthenticated: true,
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at
      };

      const authSession: AuthSession = {
        user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at
      };

      return {
        success: true,
        session: authSession
      };

    } catch (error: unknown) {
      logError(error, 'Get session service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Refresh the current user session
   * @returns Promise resolving to session result
   */
  async refreshSession(): Promise<SessionResult> {
    // Handle E2E mode with mock session refresh
    if (this.isE2EMode()) {
      console.log('🧪 E2E mode: Mock session refresh successful');
      const user: User = {
        id: 'e2e-user',
        email: 'e2e@example.com',
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const session: AuthSession = {
        user,
        accessToken: 'e2e-mock-token-refreshed',
        refreshToken: 'e2e-mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      return {
        success: true,
        session
      };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logError(error, 'Failed to refresh session');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: 'Session refresh failed - no session or user returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: true,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      const session: AuthSession = {
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      };

      return {
        success: true,
        session
      };

    } catch (error: unknown) {
      logError(error, 'Refresh session service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();